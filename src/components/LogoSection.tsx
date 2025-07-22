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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full max-w-sm sm:max-w-md"
      >
        <Button 
          onClick={() => router.push("/top100")}
          size="lg"
          className="w-full text-lg sm:text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl py-4 px-6 h-auto leading-tight"
        >
          <span className="text-center">
            OTW STAFF:<br />
            VOTE FOR YOUR TOP 25
          </span>
        </Button>
      </motion.div>
    </motion.div>
  );
}
