import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import Image from "next/image";

export function LogoSection() {
  const router = useRouter();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col items-center justify-center gap-8 px-4"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="w-full max-w-2xl"
      >
        <Image
          src="/OTWLogocolor.png"
          alt="Ones to Watch Logo"
          width={600}
          height={300}
          priority
          className="w-full h-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">10 YEARS OF DISCOVERY</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="w-full max-w-lg"
      >
        <Button 
          onClick={() => router.push("/weekly")}
          size="lg"
          className="w-full text-lg font-bold bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl py-4 px-6 h-auto"
        >
          WEEKLY DISCOVERY REWARDS
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 w-full max-w-lg"
          >

              <Button
                  onClick={() => router.push("/top100")}
                  size="lg"
                  className="flex-1 text-lg font-semibold bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl py-4 px-6 h-auto"
              >
                  GROOVER Artists
                  
              </Button>
        <Button 
          onClick={() => router.push("/top100")}
          size="lg"
          className="flex-1 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl py-4 px-6 h-auto"
        >
          OTW TOP 100
        </Button>
        
        <Button 
          onClick={() => router.push("/vibes")}
          size="lg"
          className="flex-1 text-lg font-semibold bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl py-4 px-6 h-auto"
        >
          OTW 750
              </Button>

        
      </motion.div>
    </motion.div>
  );
}
