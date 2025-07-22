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
      className="flex flex-col items-center justify-center gap-8"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Image
          src="/OTWLogocolor.png"
          alt="Ones to Watch Logo"
          width={400}
          height={200}
          priority
          className="w-auto h-auto"
        />
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button 
          onClick={() => router.push("/top100")}
          size="lg"
          className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          OTW STAFF: VOTE FOR YOUR TOP 25
        </Button>
      </motion.div>
    </motion.div>
  );
}
