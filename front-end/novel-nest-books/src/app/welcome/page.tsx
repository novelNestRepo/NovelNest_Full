"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import PageTitle from "@/components/custom/PageTitle";
import { CheckCircle2, ArrowRight } from "lucide-react";

const WelcomePage = () => {
  const router = useRouter();

  return (
    <div className="min-h-[85vh] w-full flex flex-col items-center py-12 px-6">
      <PageTitle title="Email Confirmed" icon={<CheckCircle2 className="text-emerald-500" />} />
      
      <div className="max-w-4xl mx-auto w-full flex flex-col items-center mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10 space-y-4">
          <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-headings tracking-tight">
            Congratulations!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your email has been successfully confirmed. Welcome to NovelNest, your cozy reading corner on the web.
          </p>
        </div>

        {/* Video Presentation */}
        <div className="w-full shadow-2xl rounded-2xl md:rounded-[2rem] border border-border/50 bg-background/30 p-2 md:p-4 backdrop-blur-xl relative mb-10">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-teal-400/10 rounded-2xl md:rounded-[2rem] -z-10"></div>
          <div className="rounded-xl md:rounded-2xl overflow-hidden border border-border/50 bg-black/5 aspect-video relative">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-cover"
            >
              <source src="/novel_nest.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        <Button 
          size="lg" 
          onClick={() => router.push('/login')} 
          className="h-14 px-10 text-lg group w-full sm:w-auto"
        >
          Login to your account
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
};

export default WelcomePage;
