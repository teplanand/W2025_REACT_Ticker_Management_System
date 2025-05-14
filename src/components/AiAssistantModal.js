import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiMic, FiMicOff, FiX, FiLoader } from "react-icons/fi";

const AiAssistantModal = ({ isOpen, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const audioRef = useRef(new Audio());
  const messagesEndRef = useRef(null);
  
  // Configure Web Speech API recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const currentTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join("");
        
        setTranscript(currentTranscript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setError(`Microphone error: ${event.error}`);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    } else {
      setError("Speech recognition is not supported in this browser.");
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);
  
  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Toggle listening state
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      
      // If there's a transcript, process it
      if (transcript.trim()) {
        processUserMessage(transcript.trim());
      }
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
        setTranscript("");
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setError("Failed to access microphone. Please check permissions.");
      }
    }
  }, [isListening, transcript]);
  
  // Process user message and get AI response
  const processUserMessage = useCallback(async (text) => {
    // Add user message to chat
    setMessages(prev => [...prev, { type: 'user', text }]);
    setTranscript("");
    setIsProcessing(true);
    
    try {
      // In a real app, you would call your AI service here
      // This is a simulated response for demonstration
      const aiResponse = await simulateAiResponse(text);
      
      // Add AI response to chat
      setMessages(prev => [...prev, { type: 'ai', text: aiResponse }]);
      
      // Speak the AI response using Eleven Labs
      speakWithElevenLabs(aiResponse);
    } catch (err) {
      console.error("Error processing message:", err);
      setError("Failed to get a response. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  // Simulate AI response (replace with actual API call)
  const simulateAiResponse = (text) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Sample responses based on input text
        if (text.toLowerCase().includes("ticket") && text.toLowerCase().includes("create")) {
          resolve("I can help you create a new support ticket. Would you like to create a ticket for a technical issue, billing question, or something else?");
        } else if (text.toLowerCase().includes("ticket") && text.toLowerCase().includes("status")) {
          resolve("You currently have 17 open tickets, 18 closed tickets, and 11 urgent tickets. Would you like me to summarize any specific ticket?");
        } else if (text.toLowerCase().includes("created") && text.toLowerCase().includes("site")) {
          resolve("This amazing web app is created by an exceptional team of, 5 individuals, Ambika, Aesha, Mansi, Yuvraj,and Devang. With there hardwork and dedication they have achieved this phenominal creation");
        } else if (text.toLowerCase().includes("dashboard")) {
          resolve("Your dashboard shows 43 total tickets, with 10 new tickets, 17 open tickets, and 18 closed tickets. Additionally, there are 11 urgent tickets requiring attention.");
        } else if (text.toLowerCase().includes("hello") || text.toLowerCase().includes("hi")) {
          resolve("Hello! Welcome to your ticket management dashboard. How can I assist you today with your support tickets?");
        } else if (text.toLowerCase().includes("urgent")) {
          resolve("You have 11 urgent tickets that require immediate attention. Would you like me to list them or help you address a specific one?");
        } else if (text.toLowerCase().includes("help")) {
          resolve("I can help you manage tickets, check ticket status, create new tickets, or provide summaries of ticket categories. What would you like assistance with?");
        } else {
          resolve("I understand you said: " + text + ". How can I help you with your ticket management system today?");
        }
        
      }, 1000);
    });
  };
  
  // Speak text using Eleven Labs API
  const speakWithElevenLabs = async (text) => {
    setIsSpeaking(true);
    
    try {
      // Get Eleven Labs API key from environment variable
      const apiKey = process.env.REACT_APP_ELEVEN_LABS_API_KEY || "YOUR_ELEVEN_LABS_API_KEY";
      const voiceId = process.env.REACT_APP_ELEVEN_LABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; // Default voice ID (Rachel)
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate speech with ElevenLabs');
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current.src = audioUrl;
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audioRef.current.play();
    } catch (err) {
      console.error("Error with ElevenLabs speech synthesis:", err);
      
      // Fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Select a voice that sounds natural
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes("Google") && voice.name.includes("Female")
        ) || voices[0];
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        utterance.onend = () => {
          setIsSpeaking(false);
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        console.log("Speech synthesis not supported");
        setIsSpeaking(false);
      }
    }
  };
  
  // Cancel current speech
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setIsSpeaking(false);
  }, []);
  
  // Example messages for initial state
  const exampleMessages = [
    { text: "What's the status of my tickets?", type: "user" },
    { text: "Do I have any urgent tickets?", type: "user" },
    { text: "Help me create a new ticket", type: "user" }
  ];
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
      <div 
        className="bg-[#FFF2D8] rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden animate-fadeIn"
        style={{animation: "fadeIn 0.3s ease-in-out"}}
      >
        {/* Header */}
        <div className="bg-[#113946] text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`relative ${isSpeaking ? 'animate-pulse' : ''}`}>
              <div className={`w-10 h-10 rounded-full ${isSpeaking ? 'bg-green-500' : isListening ? 'bg-red-500' : 'bg-[#113946] border-2 border-white'} flex items-center justify-center`}>
                <FiMic size={20} />
              </div>
              {(isListening || isSpeaking) && (
                <div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping"></div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold">AI Voice Assistant</h3>
              <p className="text-xs text-blue-200">
                {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Ready to help'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors text-white"
          >
            <FiX size={20} />
          </button>
        </div>
        
        {/* Voice Assistant Visualization */}
        <div className="bg-[#113946] py-6 flex items-center justify-center">
          {isSpeaking ? (
            <div className="flex items-center justify-center h-24">
              {/* Sound wave animation */}
              <div className="flex items-center gap-1 h-full">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-1 bg-blue-400 rounded-full"
                    style={{
                      height: `${20 + Math.sin(Date.now() / (100 * (i + 1)) % Math.PI) * 40}%`,
                      animationDelay: `${i * 1}s`,
                      animation: 'soundWave 1.2s ease-in-out infinite'
                    }}
                  ></div>
                ))}
              </div>
              <style jsx>{`
                @keyframes soundWave {
                  0%, 100% { height: 20%; }
                  50% { height: 80%; }
                }
              `}</style>
            </div>
          ) : (
            <div className="text-white text-center">
              <div className="mb-2 text-sm opacity-75">
                {isListening ? "I'm listening..." : "Click the microphone to speak"}
              </div>
            </div>
          )}
        </div>
        
        {/* Conversation Display Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#FFF2D8]">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <p className="text-[#113946] font-medium">Ask me anything about your ticket system</p>
              <p className="text-sm text-gray-600 mt-2">
                Try saying:
              </p>
              <div className="mt-3 space-y-2">
                {exampleMessages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className="bg-[#113946] text-white px-3 py-1 rounded-full text-sm mx-auto max-w-fit hover:bg-opacity-90 cursor-pointer transition-colors"
                    onClick={() => processUserMessage(msg.text)}
                  >
                    "{msg.text}"
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div 
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-xl ${
                      message.type === 'user' 
                        ? 'bg-[#EAD7BB] text-[#113946] rounded-lg'
                        : 'bg-[#BCA37F] text-[#443627] rounded-lg'
                    }`}
                  >
                    <p>{message.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
          
          {isListening && (
            <div className="p-3 bg-[#EAD7BB] text-[#113946] rounded-lg mt-4 animate-pulse">
              <p>{transcript || "Listening..."}</p>
            </div>
          )}
          
          {error && (
            <div className="mt-2 p-2 bg-red-100 text-red-600 rounded text-sm">
              {error}
            </div>
          )}
        </div>
        
        {/* Big Microphone Button */}
        <div className="p-6 border-t border-gray-200 bg-white flex justify-center items-center">
          <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`relative p-6 rounded-full ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-[#113946] hover:bg-[#154b5e]'
            } text-white transition-colors shadow-lg`}
          >
            {isListening ? <FiMicOff size={32} /> : <FiMic size={32} />}
            
            {/* Ripple animation when listening */}
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping"></span>
                <span className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping" style={{ animationDelay: '0.5s' }}></span>
              </>
            )}
          </button>
          
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="ml-4 p-4 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-colors"
              title="Stop speaking"
            >
              <FiX size={24} />
            </button>
          )}
          
          {isProcessing && (
            <div className="ml-4 p-4 rounded-full bg-blue-500 text-white">
              <FiLoader size={24} className="animate-spin" />
            </div>
          )}
        </div>
        
        <div className="bg-white py-2 text-xs text-gray-500 text-center border-t border-gray-100">
          <p>
            {isListening 
              ? "Listening... Tap the microphone when you're done speaking" 
              : "Tap the microphone button to start speaking"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantModal;