"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import {
  FaUsers,
  FaComments,
  FaTicketAlt,
  FaChevronRight,
  FaGithub,
  FaTwitter,
  FaLinkedin,
  FaArrowRight,
  FaCheck,
  FaLightbulb,
  FaChartLine,
  FaHeadset,
  FaRocket,
  FaShieldAlt,
  FaClock,
  FaPlay,
} from "react-icons/fa"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"

// Image paths
const images = {
  "ticket-list": "/ticketview.png",
  "ticket-view": "/ticketdetail.png",
  dashboard: "/dashboard.png",
}

const features = [
  {
    icon: <FaTicketAlt />,
    title: "Smart Ticketing",
    description: "AI-powered ticket routing and categorization to get issues to the right team members instantly.",
  },
  {
    icon: <FaHeadset />,
    title: "Omnichannel Support",
    description: "Manage customer conversations across email, chat, social media, and phone from one unified platform.",
  },
  {
    icon: <FaLightbulb />,
    title: "Knowledge Base",
    description: "Create a self-service portal with searchable articles, guides, and FAQs to empower customers.",
  },
  {
    icon: <FaUsers />,
    title: "Team Collaboration",
    description: "Work together seamlessly with internal notes, @mentions, and shared ticket ownership.",
  },
  {
    icon: <FaChartLine />,
    title: "Advanced Analytics",
    description: "Gain insights into support performance with customizable dashboards and detailed reporting.",
  },
  {
    icon: <FaComments />,
    title: "Community Forums",
    description: "Foster a self-service community where users can find solutions and share knowledge.",
  },
]

const testimonials = [
  {
    name: "Depika Bansal",
    role: "Customer Support Manager",
    company: "TechSolutions Inc.",
    avatar: "/avatar.png",
    content:
      "QuickAssist has transformed our support process. We've reduced response times by 45% and improved customer satisfaction scores significantly. The automation features alone saved us countless hours.",
  },
  {
    name: "Michael Chen",
    role: "IT Director",
    company: "Global Enterprises",
    avatar: "/avatar3.png",
    content:
      "The analytics and reporting features have given us valuable insights into our support operations. We can now make data-driven decisions that have improved our team's efficiency by over 30%.",
  },
  {
    name: "Emily Rodriguez",
    role: "Help Desk Supervisor",
    company: "Innovate Systems",
    avatar: "/avatar2.png",
    content:
      "Our team adapted to QuickAssist within days. The intuitive interface and automation features have been game-changers for our workflow. I can't imagine going back to our old system.",
  },
]

const stats = [
  { value: "99.9%", label: "Uptime" },
  { value: "45%", label: "Faster Resolution" },
  { value: "10,000+", label: "Businesses" },
  { value: "24/7", label: "Support" },
]

const WelcomePage = () => {
  const [activeTab, setActiveTab] = useState("ticket-list")
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isVisible, setIsVisible] = useState({})
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const observerRefs = useRef({})
  const heroRef = useRef(null)

  // Scroll animation
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95])

  // Typewriter effect states
  const [titleText, setTitleText] = useState("")
  const [descriptionText, setDescriptionText] = useState("")
  const fullTitleText = "Welcome to QuickAssist"
  const fullDescriptionText =
    "QuickAssist is a powerful helpdesk solution designed to streamline customer support workflows. Resolve issues faster, collaborate efficiently, and deliver exceptional customer experiences."

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observers = {}
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }))
        }
      })
    }

    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    }

    Object.keys(observerRefs.current).forEach((id) => {
      if (observerRefs.current[id]) {
        observers[id] = new IntersectionObserver(observerCallback, observerOptions)
        observers[id].observe(observerRefs.current[id])
      }
    })

    return () => {
      Object.values(observers).forEach((observer) => observer.disconnect())
    }
  }, [])

  // Typewriter effect
  useEffect(() => {
    let titleTimeout, descTimeout

    if (titleText.length < fullTitleText.length) {
      titleTimeout = setTimeout(() => {
        setTitleText(fullTitleText.slice(0, titleText.length + 1))
      }, 100)
    } else if (descriptionText.length < fullDescriptionText.length) {
      descTimeout = setTimeout(() => {
        setDescriptionText(fullDescriptionText.slice(0, descriptionText.length + 1))
      }, 30)
    }

    return () => {
      clearTimeout(titleTimeout)
      clearTimeout(descTimeout)
    }
  }, [titleText, descriptionText])

  // Testimonial rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Set observer ref
  const setObserverRef = (id) => (el) => {
    observerRefs.current[id] = el
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#113946] text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#113946]/90 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo_white.png" alt="QuickAssist Logo" className="h-10 w-10 object-contain relative rounded-full" />
            <h1 className="text-2xl font-extrabold tracking-wide text-white">
              Quick<span className="text-[#EAD7BB]">Assist</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-300 hover:text-[#EAD7BB] transition-colors">
              Features
            </a>
            <a href="#showcase" className="text-gray-300 hover:text-[#EAD7BB] transition-colors">
              Product
            </a>
            <a href="#testimonials" className="text-gray-300 hover:text-[#EAD7BB] transition-colors">
              Testimonials
            </a>
            <a href="#contact" className="text-gray-300 hover:text-[#EAD7BB] transition-colors">
              Contact
            </a>
            <div className="flex items-center space-x-4 ml-4">
              <Link to="/login">
                <button className="px-6 py-2 bg-transparent border border-[#EAD7BB] text-[#EAD7BB] font-medium rounded-md hover:bg-[#EAD7BB] hover:text-[#113946] transition duration-300">
                  Login
                </button>
              </Link>
              <Link to="/register">
                <button className="px-6 py-2 bg-[#EAD7BB] text-[#113946] font-medium rounded-md hover:bg-[#FFF2D8] transition duration-300 shadow-lg">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-white focus:outline-none" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden bg-[#0a1f2d] border-t border-[#EAD7BB]/20"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
                <a
                  href="#features"
                  className="text-gray-300 hover:text-[#EAD7BB] transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#showcase"
                  className="text-gray-300 hover:text-[#EAD7BB] transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Product
                </a>
                <a
                  href="#testimonials"
                  className="text-gray-300 hover:text-[#EAD7BB] transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Testimonials
                </a>
                <a
                  href="#contact"
                  className="text-gray-300 hover:text-[#EAD7BB] transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </a>
                <div className="flex flex-col space-y-3 pt-2">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <button className="w-full px-6 py-2 bg-transparent border border-[#EAD7BB] text-[#EAD7BB] font-medium rounded-md hover:bg-[#EAD7BB] hover:text-[#113946] transition duration-300">
                      Login
                    </button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <button className="w-full px-6 py-2 bg-[#EAD7BB] text-[#113946] font-medium rounded-md hover:bg-[#FFF2D8] transition duration-300 shadow-lg">
                      Sign Up
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative z-10 py-20 md:py-28 bg-gradient-to-b from-[#0a1f2d] to-[#113946]"
      >
        <motion.div className="container mx-auto px-4 relative z-20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <motion.div
              className="md:w-1/2"
            >
              <div className="inline-block px-4 py-1 mb-6 bg-[#EAD7BB]/20 rounded-full text-[#EAD7BB] text-sm font-medium">
                Trusted by 10,000+ support teams worldwide
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
                {titleText}
                <span className="animate-pulse">|</span>
              </h2>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                {descriptionText}
                <span
                  className={`animate-pulse ${descriptionText.length === fullDescriptionText.length ? "hidden" : ""}`}
                >
                  |
                </span>
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <button className="group px-8 py-3 bg-[#EAD7BB] text-[#113946] font-semibold rounded-md hover:bg-[#FFF2D8] transition-all duration-300 shadow-lg flex items-center gap-2">
                    Start Free Trial
                    <FaChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="px-8 py-3 bg-transparent border border-[#EAD7BB] text-[#EAD7BB] font-semibold rounded-md hover:bg-[#EAD7BB]/10 transition duration-300 flex items-center gap-2"
                >
                  Watch Demo
                  <div className="bg-[#EAD7BB] text-[#113946] rounded-full p-1">
                    <FaPlay className="w-3 h-3" />
                  </div>
                </button>
              </div>

              <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl md:text-3xl font-bold text-[#EAD7BB]">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="md:w-1/2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative">
                <div className="relative bg-[#1d4258] p-2 rounded-lg shadow-2xl overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-6 bg-[#0a1f2d] flex items-center px-2 rounded-t-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <img
                    src="/dashboard.png"
                    alt="QuickAssist Dashboard"
                    className="w-full h-auto rounded-b-md shadow-lg mt-6"
                  />

                  {/* Floating notification */}
                  <motion.div
                    className="absolute top-20 right-4 bg-white text-[#113946] p-3 rounded-lg shadow-xl max-w-[200px]"
                    initial={{ opacity: 0, y: 20, x: 20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                  >
                    <div className="text-xs font-medium">New Ticket Assigned</div>
                    <div className="text-xs text-gray-600 mt-1">Priority: High</div>
                  </motion.div>

                  {/* Floating chart */}
                  <motion.div
                    className="absolute bottom-10 left-4 bg-white text-[#113946] p-2 rounded-lg shadow-xl"
                    initial={{ opacity: 0, y: 20, x: -20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                  >
                    <div className="text-xs font-medium mb-1">Resolution Time</div>
                    <div className="flex items-end h-10 space-x-1">
                      {[40, 65, 35, 70, 55, 80, 60].map((height, i) => (
                        <div
                          key={i}
                          className="w-3 bg-gradient-to-t from-[#113946] to-[#EAD7BB] rounded-sm"
                          style={{ height: `${height}%` }}
                        ></div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Trusted by logos */}
              <motion.div
                className="mt-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8, duration: 0.8 }}
              >
                <p className="text-sm text-gray-400 mb-4">TRUSTED BY INNOVATIVE COMPANIES</p>
                <div className="flex justify-center items-center space-x-8 opacity-70">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-6 w-16 bg-gray-400 rounded opacity-50"></div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[#0a1f2d]" ref={setObserverRef("features")}>
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible["features"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-1 mb-4 bg-[#EAD7BB]/20 rounded-full text-[#EAD7BB] text-sm font-medium">
              Powerful Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Everything You Need in One Platform</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Streamline your customer support workflow with our comprehensive set of tools and features
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group bg-gradient-to-br from-[#164863] to-[#113946] p-8 rounded-xl shadow-xl relative overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible["features"] ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#EAD7BB]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="text-4xl mb-6 bg-[#0a1f2d] p-4 rounded-full inline-block text-[#EAD7BB] relative z-10">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white relative z-10">{feature.title}</h3>
                <p className="text-gray-300 relative z-10">{feature.description}</p>

                <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-10">
                  <a href="#" className="text-[#EAD7BB] text-sm font-medium flex items-center">
                    Learn more <FaArrowRight className="ml-2 text-xs" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          {/* AI Feature highlight */}
          <motion.div
            className="mt-20 bg-gradient-to-r from-[#164863] to-[#113946] rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible["features"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/2 p-10 lg:p-16">
                <div className="inline-block px-4 py-1 mb-4 bg-[#EAD7BB]/20 rounded-full text-[#EAD7BB] text-sm font-medium">
                  Featured
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">AI-Powered Support Automation</h3>
                <p className="text-gray-300 mb-6">
                Our advanced AI assistant helps you streamline conversations, enhance chat responses, and analyze incoming messages for potential issues. Improve response accuracy, reduce spam, and ensure a seamless experience for your users.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Intelligent voice and chat assistance",
                    " Smart response suggestions and automation",
                    "AI-powered message analysis for spam detection",
                    "Sentiment analysis to flag inappropriate content",
                    "Automated filtering of harmful or unwanted text",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <FaCheck className="text-[#EAD7BB] mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#"
                  className="inline-flex items-center px-6 py-3 bg-[#EAD7BB] text-[#113946] font-semibold rounded-md hover:bg-[#FFF2D8] transition duration-300 shadow-lg"
                >
                  Learn More <FaArrowRight className="ml-2" />
                </a>
              </div>
              <div className="lg:w-1/2 bg-[#0a1f2d] p-10 flex items-center justify-center">
                <div className="relative">
                  <div className="relative bg-[#1d4258] p-3 rounded-lg shadow-xl">
                    <img src="/ticketview.png" alt="AI-Powered Support" className="w-full h-auto rounded-md" />

                    {/* AI suggestion overlay */}
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-white text-[#113946] p-3 rounded-lg shadow-xl max-w-[80%] border-l-4 border-[#EAD7BB]">
                      <div className="text-xs font-bold mb-1">AI Suggestion</div>
                      <div className="text-xs">
                        Based on similar tickets, this appears to be a login issue. Suggested response template: "Login
                        Troubleshooting" is ready to use.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 bg-gradient-to-b from-[#113946] to-[#0a1f2d]" ref={setObserverRef("demo")}>
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible["demo"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-1 mb-4 bg-[#EAD7BB]/20 rounded-full text-[#EAD7BB] text-sm font-medium">
              Interactive Demo
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">See QuickAssist in Action</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Experience how QuickAssist can transform your customer support workflow
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto">
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#164863] to-[#113946] flex items-center justify-center">
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="group relative z-10 flex items-center justify-center"
                >
                  <div className="absolute -inset-8 md:-inset-12 rounded-full bg-[#EAD7BB]/10 group-hover:bg-[#EAD7BB]/20 transition-all duration-300"></div>
                  <div className="absolute -inset-6 md:-inset-10 rounded-full bg-[#EAD7BB]/20 group-hover:bg-[#EAD7BB]/30 transition-all duration-300"></div>
                  <div className="absolute -inset-4 md:-inset-8 rounded-full bg-[#EAD7BB]/30 group-hover:bg-[#EAD7BB]/40 transition-all duration-300"></div>
                  <div className="bg-[#EAD7BB] text-[#113946] rounded-full p-4 md:p-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FaPlay className="w-4 h-4 md:w-6 md:h-6" />
                  </div>
                </button>

                <img
                  src="/dashboard.png"
                  alt="QuickAssist Demo"
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                />
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Quick Setup",
                  description:
                    "Get started in minutes with our intuitive onboarding process. No technical expertise required.",
                },
                {
                  title: "Seamless Integration",
                  description:
                    "Connect with your existing tools and services. QuickAssist works with the software you already use.",
                },
                {
                  title: "Continuous Support",
                  description:
                    "Our team is available 24/7 to help you get the most out of QuickAssist and answer any questions.",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="bg-[#164863] p-6 rounded-lg shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible["demo"] ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                >
                  <h3 className="text-xl font-semibold text-[#EAD7BB] mb-2">{item.title}</h3>
                  <p className="text-gray-300">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase Section */}
      <section id="showcase" className="py-20 bg-[#0a1f2d]" ref={setObserverRef("showcase")}>
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible["showcase"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-1 mb-4 bg-[#EAD7BB]/20 rounded-full text-[#EAD7BB] text-sm font-medium">
              Product Tour
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Discover QuickAssist</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              See how our platform can transform your customer support experience
            </p>
          </motion.div>

          <div className="flex flex-col items-center">
            <div className="flex justify-center space-x-4 md:space-x-8 mb-8 border-b border-[#EAD7BB]/20 pb-2 w-full max-w-2xl overflow-x-auto">
              {Object.keys(images).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-gray-300 hover:text-[#EAD7BB] transition-colors px-4 py-2 whitespace-nowrap ${
                    activeTab === tab ? "text-[#EAD7BB] font-semibold border-b-2 border-[#EAD7BB]" : ""
                  }`}
                >
                  {tab
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </button>
              ))}
            </div>

            <motion.div
              className="w-full max-w-5xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <div className="relative bg-[#1d4258] p-3 rounded-xl shadow-2xl">
                  {/* Browser mockup */}
                  <div className="bg-[#0a1f2d] rounded-t-lg p-2 flex items-center">
                    <div className="flex space-x-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="mx-auto bg-[#164863] rounded-md px-4 py-1 text-xs text-gray-300 max-w-xs truncate">
                      app.quickassist.io/{activeTab.replace("-", "/")}
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <img
                        src={images[activeTab] || "/placeholder.svg"}
                        alt={activeTab.replace("-", " ")}
                        className="w-full rounded-b-lg shadow-lg"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              <div className="mt-8 text-center">
                <h3 className="text-xl font-semibold text-[#EAD7BB] mb-2">
                  {activeTab === "ticket-list" && "Manage Support Tickets Efficiently"}
                  {activeTab === "ticket-view" && "Detailed Ticket Information"}
                  {activeTab === "dashboard" && "Comprehensive Analytics Dashboard"}
                </h3>
                <p className="text-gray-300 max-w-3xl mx-auto">
                  {activeTab === "ticket-list" &&
                    "View, sort, and filter all your support tickets in one place. Assign tickets to team members, set priorities, and track their status with our intuitive interface."}
                  {activeTab === "ticket-view" &&
                    "Access all ticket details, customer information, and conversation history. Add internal notes, update ticket status, and collaborate with team members to resolve issues faster."}
                  {activeTab === "dashboard" &&
                    "Monitor key metrics, track team performance, and identify trends with our powerful analytics dashboard. Make data-driven decisions to improve your support operations."}
                </p>

                <div className="mt-6 flex justify-center">
                  <a
                    href="#"
                    className="inline-flex items-center px-6 py-2 bg-transparent border border-[#EAD7BB] text-[#EAD7BB] font-medium rounded-md hover:bg-[#EAD7BB]/10 transition duration-300"
                  >
                    See All Features <FaArrowRight className="ml-2 text-sm" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonials"
        className="py-20 bg-gradient-to-b from-[#0a1f2d] to-[#113946]"
        ref={setObserverRef("testimonials")}
      >
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible["testimonials"] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-1 mb-4 bg-[#EAD7BB]/20 rounded-full text-[#EAD7BB] text-sm font-medium">
              Testimonials
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">What Our Customers Say</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Join thousands of businesses that trust QuickAssist for their support needs
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  className="bg-gradient-to-br from-[#164863] to-[#113946] p-8 md:p-10 rounded-xl shadow-xl"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex flex-col md:flex-row md:items-center">
                    <div className="mb-6 md:mb-0 md:mr-8">
                      <img
                        src={testimonials[currentTestimonial].avatar || "/placeholder.svg"}
                        alt={testimonials[currentTestimonial].name}
                        className="rounded-full border-2 border-[#EAD7BB]"
                      />
                    </div>
                    <div>
                      <div className="mb-6">
                        <svg className="h-8 w-8 text-[#EAD7BB] opacity-50" fill="currentColor" viewBox="0 0 32 32">
                          <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                        </svg>
                      </div>
                      <p className="text-lg text-gray-300 mb-6 italic">"{testimonials[currentTestimonial].content}"</p>
                      <div>
                        <p className="font-semibold text-white">{testimonials[currentTestimonial].name}</p>
                        <p className="text-sm text-gray-400">
                          {testimonials[currentTestimonial].role}, {testimonials[currentTestimonial].company}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation arrows */}
              <button
                className="absolute top-1/2 -left-4 md:-left-12 transform -translate-y-1/2 bg-[#164863] p-2 rounded-full text-white hover:bg-[#113946] transition-colors"
                onClick={() => setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                aria-label="Previous testimonial"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute top-1/2 -right-4 md:-right-12 transform -translate-y-1/2 bg-[#164863] p-2 rounded-full text-white hover:bg-[#113946] transition-colors"
                onClick={() => setCurrentTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                aria-label="Next testimonial"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full ${currentTestimonial === index ? "bg-[#EAD7BB]" : "bg-gray-600"}`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#113946]">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-[#164863] to-[#113946] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 p-12">
                <div className="inline-block px-4 py-1 mb-4 bg-[#EAD7BB]/20 rounded-full text-[#EAD7BB] text-sm font-medium">
                  Get Started Today
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  Ready to transform your customer support?
                </h2>
                <p className="text-gray-300 mb-8">
                  Join thousands of businesses that use QuickAssist to provide exceptional customer support. Get started
                  today with our 14-day free trial.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/register">
                    <button className="group px-8 py-3 bg-[#EAD7BB] text-[#113946] font-semibold rounded-md hover:bg-[#FFF2D8] transition-all duration-300 shadow-lg flex items-center gap-2">
                      Start Free Trial
                      <FaChevronRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                  <a href="#contact">
                    <button className="px-8 py-3 bg-transparent border border-[#EAD7BB] text-[#EAD7BB] font-semibold rounded-md hover:bg-[#EAD7BB]/10 transition duration-300">
                      Schedule Demo
                    </button>
                  </a>
                </div>

                {/* Trust indicators */}
                <div className="mt-8 flex flex-col space-y-4">
                  <div className="flex items-center">
                    <FaShieldAlt className="text-[#EAD7BB] mr-2" />
                    <span className="text-gray-300 text-sm">Secure & GDPR Compliant</span>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="text-[#EAD7BB] mr-2" />
                    <span className="text-gray-300 text-sm">Set up in minutes, not days</span>
                  </div>
                  <div className="flex items-center">
                    <FaRocket className="text-[#EAD7BB] mr-2" />
                    <span className="text-gray-300 text-sm">Free onboarding support</span>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 p-6 md:p-0">
                <div className="relative">
                  <div className="relative bg-[#1d4258] p-2 rounded-lg shadow-2xl">
                    <img
                      src="/ticketview.png"
                      alt="QuickAssist Platform"
                      className="w-full h-auto rounded-md shadow-lg transform md:translate-x-12"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a1f2d] py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/logo.png"
                  alt="QuickAssist Logo"
                  className="h-10 w-10 object-contain relative rounded-full"
                />
                <h3 className="text-xl font-bold text-white">
                  Quick<span className="text-[#EAD7BB]">Assist</span>
                </h3>
              </div>
              <p className="text-gray-400 mb-4">Helping businesses solve issues, one ticket at a time.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-[#EAD7BB] transition-colors">
                  <FaTwitter size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-[#EAD7BB] transition-colors">
                  <FaLinkedin size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-[#EAD7BB] transition-colors">
                  <FaGithub size={20} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#EAD7BB] transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#EAD7BB] transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#EAD7BB] transition-colors">
                    Integrations
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#EAD7BB] transition-colors">
                    Roadmap
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#EAD7BB] transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#EAD7BB] transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#EAD7BB] transition-colors">
                    Community
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#EAD7BB] transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#EAD7BB] transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#EAD7BB] transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#EAD7BB] transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#EAD7BB] transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">&copy; {new Date().getFullYear()} QuickAssist. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsVideoModalOpen(false)}
          >
            <motion.div
              className="bg-[#0a1f2d] rounded-xl overflow-hidden max-w-4xl w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 flex justify-between items-center border-b border-gray-800">
                <h3 className="text-xl font-semibold text-white">QuickAssist Demo</h3>
                <button onClick={() => setIsVideoModalOpen(false)} className="text-gray-400 hover:text-white">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="aspect-video bg-black flex items-center justify-center">
              <video controls className="w-full h-full">
            <source src="/demo-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default WelcomePage

