import React from 'react';
import { Download, Gamepad2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DownloadPageProps {
  url: string;
  onBack: () => void;
}

export default function DownloadPage({ url, onBack }: DownloadPageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground relative">
      <Button 
        variant="ghost" 
        className="absolute top-6 left-6 font-bold flex items-center gap-2 text-muted-foreground hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="w-5 h-5" /> Back to Store
      </Button>

      <div className="max-w-2xl w-full bg-card rounded-[3rem] border-4 border-border shadow-2xl p-8 md:p-16 text-center space-y-8 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-primary text-secondary rounded-[2rem] flex items-center justify-center shadow-xl mb-8 -rotate-6">
            <Gamepad2 className="w-12 h-12" />
          </div>

          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4">
            Download Game Here
          </h1>
          
          <p className="text-lg text-muted-foreground font-medium mb-12 max-w-md mx-auto">
            Click the button below to download your purchased FC 26 PC game.
          </p>

          <Button
            className="w-full sm:w-auto h-16 px-12 text-xl font-black tracking-widest rounded-2xl bg-primary text-secondary hover:bg-primary/90 shadow-2xl transition-all hover:scale-105 active:scale-95 group uppercase"
            onClick={() => window.open(url, "_blank")}
          >
            <Download className="w-6 h-6 mr-3 group-hover:-translate-y-1 transition-transform" /> 
            Download FC 26 PC
          </Button>
        </div>
      </div>
    </div>
  );
}
