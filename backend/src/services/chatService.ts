import { FAQ } from '../models/FAQ';
import { detectLanguage } from './languageService';
import { logger } from '../utils/logger';
import { flaskRAGService, RAGChatResponse } from './flaskRAGService';

export interface ChatResponse {
  message: string;
  language: string;
  confidence: number;
  intent: string;
  entities: string[];
  timestamp: Date;
  source?: string;
  ragEnabled?: boolean;
}

export async function processMessage(
  userMessage: string,
  userLanguage: string,
  sessionId: string
): Promise<ChatResponse> {
  try {
    const startTime = Date.now();
    const detectedLanguage = userLanguage || await detectLanguage(userMessage);
    const finalLanguage = detectedLanguage || 'en';
    
    logger.info(`Processing message for session ${sessionId}: "${userMessage}" in language: ${finalLanguage}`);

    // Try Flask RAG service first
    try {
      const ragResponse = await flaskRAGService.sendMessageToRAG(
        userMessage,
        sessionId,
        finalLanguage
      );

      // Only use RAG response if it's actually from RAG (not the generic fallback)
      if (ragResponse.ragEnabled && ragResponse.source !== 'express_fallback') {
        const processingTime = Date.now() - startTime;
        logger.info(`RAG response generated in ${processingTime}ms for session: ${sessionId}`);
        
        return {
          message: ragResponse.message,
          language: ragResponse.language,
          confidence: ragResponse.confidence,
          intent: ragResponse.intent,
          entities: ragResponse.entities,
          timestamp: ragResponse.timestamp,
          source: ragResponse.source,
          ragEnabled: ragResponse.ragEnabled
        };
      } else {
        // If RAG returns fallback, don't use it - let FAQ system handle it
        throw new Error('RAG service returned fallback response');
      }

    } catch (ragError) {
      logger.warn('RAG service not available or returned fallback, using FAQ system:', ragError instanceof Error ? ragError.message : 'Unknown error');
      
      // Fallback to existing FAQ system
      const normalizedMessage = normalizeMessage(userMessage);
      const { intent, entities, confidence } = await extractIntentAndEntities(normalizedMessage, finalLanguage);
      const matchedFAQ = await findBestResponse(normalizedMessage, intent, finalLanguage);
      
      let response;
      if (matchedFAQ) {
        response = matchedFAQ.answer;
        logger.info(`Using FAQ response for category: ${matchedFAQ.category}`);
      } else {
        response = getFallbackResponse(finalLanguage, intent);
        logger.info(`Using fallback response for intent: ${intent}`);
      }
      
      const processingTime = Date.now() - startTime;
      logger.info(`FAQ fallback response generated in ${processingTime}ms for session: ${sessionId}`);
      
      return {
        message: response,
        language: finalLanguage,
        confidence: confidence || 0.7,
        intent,
        entities,
        timestamp: new Date(),
        source: matchedFAQ ? 'faq_database' : 'fallback',
        ragEnabled: false
      };
    }

  } catch (error: any) {
    logger.error('Chat processing error:', error);
    return {
      message: 'I apologize, but I\'m experiencing technical difficulties. Please try again later or contact support.',
      language: userLanguage || 'en',
      confidence: 0.1,
      intent: 'error',
      entities: [],
      timestamp: new Date(),
      source: 'error_handler',
      ragEnabled: false
    };
  }
}

function normalizeMessage(message: string): string {
  return message.toLowerCase().trim();
}

async function extractIntentAndEntities(message: string, language: string): Promise<{
  intent: string;
  entities: string[];
  confidence: number;
}> {
  // Enhanced keyword mapping for better intent detection
  const admissionKeywords = ['admission', 'admissions', 'join', 'enrollment', 'apply', 'application', 'entrance', 'eligibility', 'requirement', 'requirements', 'criteria', 'cutoff', 'merit'];
  const feeKeywords = ['fee', 'fees', 'payment', 'due', 'charge', 'cost', 'amount', 'tuition', 'money', 'price', 'scholarship', 'scholarships', 'financial'];
  const academicKeywords = ['marks', 'grade', 'result', 'exam', 'test', 'course', 'courses', 'subject', 'subjects', 'syllabus', 'curriculum', 'semester', 'academic', 'study', 'studies'];
  const hostelKeywords = ['hostel', 'room', 'accommodation', 'mess', 'warden', 'boarding', 'residence', 'dormitory'];
  const facilitiesKeywords = ['library', 'lab', 'laboratory', 'facility', 'facilities', 'infrastructure', 'building', 'campus', 'wifi'];
  const placementKeywords = ['placement', 'placements', 'job', 'jobs', 'career', 'company', 'companies', 'recruitment', 'internship'];
  const contactKeywords = ['contact', 'phone', 'email', 'address', 'location', 'office', 'hours', 'timing'];

  const lowerMessage = message.toLowerCase();
  
  let intent = 'general';
  let confidence = 0.6;
  
  if (admissionKeywords.some(keyword => lowerMessage.includes(keyword))) {
    intent = 'admissions';
    confidence = 0.9;
  } else if (feeKeywords.some(keyword => lowerMessage.includes(keyword))) {
    intent = 'fees';
    confidence = 0.9;
  } else if (academicKeywords.some(keyword => lowerMessage.includes(keyword))) {
    intent = 'academics';
    confidence = 0.8;
  } else if (hostelKeywords.some(keyword => lowerMessage.includes(keyword))) {
    intent = 'hostel';
    confidence = 0.8;
  } else if (facilitiesKeywords.some(keyword => lowerMessage.includes(keyword))) {
    intent = 'facilities';
    confidence = 0.8;
  } else if (placementKeywords.some(keyword => lowerMessage.includes(keyword))) {
    intent = 'placements';
    confidence = 0.8;
  } else if (contactKeywords.some(keyword => lowerMessage.includes(keyword))) {
    intent = 'contact';
    confidence = 0.8;
  }

  // Extract entities (keywords found in the message)
  const allKeywords = [...admissionKeywords, ...feeKeywords, ...academicKeywords, ...hostelKeywords, ...facilitiesKeywords, ...placementKeywords, ...contactKeywords];
  const entities = allKeywords.filter(keyword => lowerMessage.includes(keyword));

  logger.info(`Intent detected: ${intent} with confidence ${confidence} for message: "${message}"`);

  return {
    intent,
    entities,
    confidence
  };
}

async function findBestResponse(message: string, intent: string, language: string): Promise<any> {
  try {
    logger.info(`Searching for FAQ with intent: ${intent} and language: ${language}`);
    
    // First try to find FAQs by category
    let faqs = await FAQ.find({ 
      category: intent,
      language: language,
      isActive: true 
    }).limit(10);

    // If no FAQs found for the specific language, try English as fallback
    if (faqs.length === 0 && language !== 'en') {
      faqs = await FAQ.find({ 
        category: intent,
        language: 'en',
        isActive: true 
      }).limit(10);
    }

    // If still no FAQs found by category, try keyword-based search
    if (faqs.length === 0) {
      const searchKeywords = message.split(' ').filter(word => word.length > 2);
      const keywordRegex = new RegExp(searchKeywords.join('|'), 'i');
      
      faqs = await FAQ.find({
        $or: [
          { question: keywordRegex },
          { answer: keywordRegex },
          { keywords: { $in: searchKeywords } }
        ],
        language: language,
        isActive: true
      }).limit(5);

      // Fallback to English if no results in target language
      if (faqs.length === 0 && language !== 'en') {
        faqs = await FAQ.find({
          $or: [
            { question: keywordRegex },
            { answer: keywordRegex },
            { keywords: { $in: searchKeywords } }
          ],
          language: 'en',
          isActive: true
        }).limit(5);
      }
    }

    // Check if FAQ found and increment access count
    if (faqs && faqs.length > 0) {
      const selectedFAQ = faqs[0];
      if (selectedFAQ) {
        selectedFAQ.accessCount = (selectedFAQ.accessCount || 0) + 1;
        await selectedFAQ.save();
        logger.info(`Found FAQ: "${selectedFAQ.question.substring(0, 100)}..." with category: ${selectedFAQ.category}`);
        return selectedFAQ;
      }
    }

    logger.warn(`No FAQ found for intent: ${intent}, language: ${language}, message: "${message}"`);
    return null;
  } catch (error) {
    logger.error('Error finding FAQ response:', error);
    return null;
  }
}

function getFallbackResponse(language: string, intent: string): string {
  const fallbacks = {
    en: {
      admissions: 'For admission requirements, JECRC Foundation offers various courses with different eligibility criteria. Engineering courses require JEE Main/REAP qualification, while management courses need CAT/MAT/CMAT. Please contact the admissions office at +91-141-2770000 for detailed information about specific courses.',
      fees: 'Fee structure varies by course and program. Engineering courses range from ₹80,000 to ₹1,20,000 per year, while management courses range from ₹70,000 to ₹1,00,000 per year. Scholarships and payment plans are available. Please visit the accounts office for exact fee details.',
      academics: 'For academic queries including syllabus, course structure, and examination details, please contact your department office or check the student portal. Our academic office is available Monday to Saturday, 9:00 AM to 5:00 PM.',
      hostel: 'JECRC provides separate hostels for boys and girls with modern amenities including furnished rooms, mess facilities, Wi-Fi, and 24/7 security. Hostel fees range from ₹60,000 to ₹80,000 per year including meals. For hostel admission, contact the hostel office.',
      facilities: 'JECRC has state-of-the-art facilities including well-equipped laboratories, central library with 50,000+ books, Wi-Fi campus, sports facilities, and research centers. The library is open from 8:00 AM to 10:00 PM on weekdays.',
      placements: 'JECRC has an excellent placement record with 85%+ placement rate. Top companies like TCS, Infosys, Wipro, Cognizant visit for recruitment. Average packages range from ₹3-6 LPA. Contact the placement cell for more details.',
      contact: 'You can contact JECRC Foundation at: Phone: +91-141-2770000, Email: info@jecrc.ac.in, Address: JECRC Foundation, Jaipur-Jodhpur Highway, Ramchapdra, Jaipur - 303905, Rajasthan. Office hours: Monday to Saturday, 9:00 AM to 5:00 PM.',
      general: 'Hello! I\'m Dhruv, your JECRC campus assistant. I can help you with information about admissions, fees, courses, facilities, scholarships, placements, and more. Please feel free to ask me any specific questions about JECRC Foundation.'
    },
    hi: {
      admissions: 'प्रवेश आवश्यकताओं के लिए, JECRC Foundation विभिन्न पाठ्यक्रम प्रदान करता है। इंजीनियरिंग के लिए JEE Main/REAP और प्रबंधन के लिए CAT/MAT/CMAT आवश्यक है। विस्तृत जानकारी के लिए प्रवेश कार्यालय से +91-141-2770000 पर संपर्क करें।',
      fees: 'फीस संरचना कोर्स के अनुसार अलग होती है। इंजीनियरिंग ₹80,000 से ₹1,20,000 प्रति वर्ष और प्रबंधन ₹70,000 से ₹1,00,000 प्रति वर्ष है। छात्रवृत्ति उपलब्ध है। सटीक फीस के लिए खाता कार्यालय से मिलें।',
      academics: 'शैक्षणिक प्रश्न, पाठ्यक्रम और परीक्षा विवरण के लिए अपने विभाग कार्यालय से संपर्क करें या स्टूडेंट पोर्टल देखें।',
      hostel: 'JECRC में लड़कों और लड़कियों के लिए अलग छात्रावास हैं। सभी सुविधाओं के साथ फीस ₹60,000 से ₹80,000 प्रति वर्ष है।',
      facilities: 'JECRC में आधुनिक प्रयोगशालाएं, 50,000+ पुस्तकों के साथ केंद्रीय पुस्तकालय, Wi-Fi कैंपस और खेल सुविधाएं हैं।',
      placements: 'JECRC में 85%+ प्लेसमेंट रेट है। TCS, Infosys जैसी कंपनियां आती हैं। औसत पैकेज ₹3-6 लाख है।',
      contact: 'संपर्क: फोन: +91-141-2770000, ईमेल: info@jecrc.ac.in, पता: JECRC Foundation, जयपुर-जोधपुर हाईवे, रामचांद्रपुरा, जयपुर - 303905।',
      general: 'नमस्ते! मैं ध्रुव हूं, आपका JECRC कैंपस सहायक। मैं प्रवेश, फीस, कोर्स, सुविधाओं के बारे में जानकारी दे सकता हूं।'
    },
    raj: {
      admissions: 'दाखले के लिए JECRC म्हैं अलग-अलग कोर्स सै। इंजीनियरिंग के लिए JEE अर मैनेजमेंट के लिए CAT चाहिए। विस्तार सूं जाणने के लिए +91-141-2770000 पर फोन करो।',
      fees: 'फीस कोर्स के हिसाब सूं अलग सै। इंजीनियरिंग ₹80,000 सूं ₹1,20,000 साल अर मैनेजमेंट ₹70,000 सूं ₹1,00,000 साल सै।',
      academics: 'पढाई के बारे म्हैं जाणने के लिए आपणे डिपार्टमेंट ऑफिस म्हैं जाओ या स्टूडेंट पोर्टल देखो।',
      hostel: 'JECRC म्हैं लड़कों अर लड़कियों के लिए अलग होस्टल सै। सारी सुविधा के साथ फीस ₹60,000 सूं ₹80,000 साल सै।',
      facilities: 'JECRC म्हैं बढिया लैब, लाइब्रेरी, Wi-Fi अर खेल की सुविधा सै।',
      placements: 'JECRC म्हैं 85% सूं ज्यादा प्लेसमेंट होवै सै। बड़ी कंपनी आवै सै। औसत पैकेज ₹3-6 लाख सै।',
      contact: 'संपर्क: फोन: +91-141-2770000, ईमेल: info@jecrc.ac.in, पता: JECRC Foundation, जयपुर-जोधपुर हाईवे, जयपुर।',
      general: 'नमस्कार! म्हैं ध्रुव हूं, थारो JECRC कैंपस मददगार। म्हैं दाखला, फीस, कोर्स की जाणकारी दे सकूं।'
    }
  };

  const langFallbacks = fallbacks[language as keyof typeof fallbacks] || fallbacks.en;
  return langFallbacks[intent as keyof typeof langFallbacks] || langFallbacks.general;
}
