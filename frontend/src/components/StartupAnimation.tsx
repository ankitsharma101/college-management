import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, MessageCircle, Globe, GraduationCap, Users, BookOpen } from 'lucide-react';

interface StartupAnimationProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const StartupAnimation: React.FC<StartupAnimationProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Animation steps and timing (moved outside component to prevent recreation)
  const steps = React.useMemo(() => [
    { text: "Initializing JECRC Portal...", duration: 800 },
    { text: "Loading Dhruv AI Assistant...", duration: 1000 },
    { text: "Connecting to Campus Services...", duration: 800 },
    { text: "Ready to Serve!", duration: 600 }
  ], []);

  const completeAnimation = React.useCallback(() => {
    if (!isCompleted) {
      setIsCompleted(true);
      setTimeout(() => onComplete(), 200);
    }
  }, [isCompleted, onComplete]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let stepTimeouts: NodeJS.Timeout[] = [];

    const runAnimation = () => {
      console.log('Starting startup animation...');
      
      // Progress bar animation - complete in 3.8 seconds
      let progressCount = 0;
      progressInterval = setInterval(() => {
        progressCount++;
        setProgress((prev) => {
          const newProgress = Math.min(prev + 2.6, 100); // Slightly faster: 2.6% every 50ms
          
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            console.log('Progress animation completed');
            completeAnimation();
            return 100;
          }
          
          // Debug logging for stuck progress
          if (progressCount % 20 === 0) {
            console.log(`Progress: ${newProgress}%`);
          }
          
          return newProgress;
        });
      }, 50);

      // Step progression - properly schedule each step
      let totalTime = 0;
      steps.forEach((step, index) => {
        const timeout = setTimeout(() => {
          console.log(`Step ${index}: ${step.text}`);
          setCurrentStep(index);
        }, totalTime);
        stepTimeouts.push(timeout);
        totalTime += step.duration;
      });
    };

    // Start animation after a short delay
    const startDelay = setTimeout(runAnimation, 300);

    // Fallback timeout - if animation doesn't complete in 5 seconds, force completion
    const fallbackTimeout = setTimeout(() => {
      console.warn('Startup animation fallback triggered - forcing completion');
      completeAnimation();
    }, 5000);

    return () => {
      clearTimeout(startDelay);
      clearTimeout(fallbackTimeout);
      stepTimeouts.forEach(timeout => clearTimeout(timeout));
      clearInterval(progressInterval);
    };
  }, [completeAnimation, steps]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating geometric shapes */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeOut"
            }}
          />
        ))}

        {/* Large background circles */}
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1.3, 1, 1.3],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Skip button */}
      <motion.button
        className="absolute top-6 right-6 z-20 px-4 py-2 text-sm text-blue-200 hover:text-white transition-colors duration-200 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full border border-white/20"
        onClick={onSkip}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Skip Animation →
      </motion.button>

      {/* Main content */}
      <motion.div 
        className="text-center z-10 px-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* JECRC Logo/Brand Section */}
        <motion.div
          className="mb-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
        >
          {/* Main logo container */}
          <motion.div 
            className="relative mb-6"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="w-32 h-32 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-full mx-auto relative flex items-center justify-center shadow-2xl">
              {/* Pulsing effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.3, 1],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* JECRC Text */}
              <motion.div 
                className="relative z-10 text-white font-bold text-xl"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <GraduationCap className="h-16 w-16" />
              </motion.div>

              {/* Orbiting icons */}
              {[
                { icon: BookOpen, angle: 0, color: "text-blue-300" },
                { icon: Users, angle: 120, color: "text-green-300" },
                { icon: Bot, angle: 240, color: "text-purple-300" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="absolute w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                  style={{
                    transformOrigin: '80px 80px',
                  }}
                  animate={{
                    rotate: [item.angle, item.angle + 360],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </motion.div>
              ))}
            </div>

            {/* Floating sparkles around logo */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  top: `${30 + Math.random() * 40}%`,
                  left: `${30 + Math.random() * 40}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeInOut"
                }}
              >
                <Sparkles className="h-6 w-6 text-yellow-300" />
              </motion.div>
            ))}
          </motion.div>

          {/* JECRC Foundation Title */}
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-white mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <span className="bg-gradient-to-r from-orange-300 to-pink-300 bg-clip-text text-transparent">
              JECRC
            </span>{" "}
            <span className="text-white/90">Foundation</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-blue-100 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            College Portal & AI Assistant
          </motion.p>

          <motion.p
            className="text-sm text-blue-200/80"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            SIH 2025 Project - Smart India Hackathon
          </motion.p>
        </motion.div>

        {/* Dhruv AI Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <motion.div
              className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center"
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(139, 92, 246, 0.4)",
                  "0 0 0 15px rgba(139, 92, 246, 0.1)",
                  "0 0 0 0 rgba(139, 92, 246, 0.4)"
                ]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Bot className="h-6 w-6 text-white" />
            </motion.div>
            <h2 className="text-2xl font-semibold text-white">
              Meet <span className="bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">Dhruv</span>
            </h2>
          </div>
          <p className="text-blue-100/80 text-sm">
            Your Multilingual Campus Assistant
          </p>
        </motion.div>

        {/* Loading Status */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.6 }}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              className="text-blue-100 mb-6 h-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {steps[currentStep]?.text || ""}
            </motion.p>
          </AnimatePresence>

          {/* Progress Bar */}
          <div className="w-80 max-w-sm mx-auto">
            <div className="flex justify-between text-xs text-blue-200 mb-2">
              <span>Loading...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 rounded-full relative"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Feature Icons */}
        <motion.div 
          className="flex justify-center space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          {[
            { icon: MessageCircle, label: "Chat", color: "from-blue-400 to-blue-600" },
            { icon: Globe, label: "Multilingual", color: "from-green-400 to-green-600" },
            { icon: GraduationCap, label: "Academic", color: "from-purple-400 to-purple-600" },
          ].map((item, index) => (
            <motion.div
              key={index}
              className="text-center"
              animate={{
                y: [-3, 3, -3],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: index * 0.4,
                ease: "easeInOut"
              }}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${item.color} flex items-center justify-center mb-2 shadow-lg`}>
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs text-blue-200">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default StartupAnimation;