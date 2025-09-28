'use client';

import { Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DownloadQualityTooltipProps {
  photoId: string;
  photoUrl: string;
  originalName: string;
  className?: string;
}

export function DownloadQualityTooltip({ 
  photoId, 
  photoUrl, 
  originalName,
  className = "" 
}: DownloadQualityTooltipProps) {
  return (
    <TooltipProvider>
      <div className={`flex flex-col gap-2 sm:flex-row ${className}`}>
        {/* Original Quality Download */}
        <Tooltip>
          <TooltipTrigger asChild>
            <a 
              href={`/api/photos/${photoId}/original`} 
              download={originalName}
              target="_blank" 
              rel="noopener noreferrer"
              className="group"
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white bg-green-600/80 hover:bg-green-700/90 hover:text-white touch-target relative"
              >
                <Download className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="absolute -top-1 -right-1 bg-green-400 text-green-900 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  O
                </span>
              </Button>
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-green-900 text-green-100 border-green-700">
            <div className="text-center">
              <div className="font-semibold">Original Quality</div>
              <div className="text-xs opacity-90">100% • No compression</div>
              <div className="text-xs opacity-75">Perfect for print & professional use</div>
            </div>
          </TooltipContent>
        </Tooltip>
        
        {/* Web Quality Download */}
        <Tooltip>
          <TooltipTrigger asChild>
            <a 
              href={photoUrl} 
              download={originalName}
              target="_blank" 
              rel="noopener noreferrer"
              className="group"
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white bg-blue-600/80 hover:bg-blue-700/90 hover:text-white touch-target relative"
              >
                <Download className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="absolute -top-1 -right-1 bg-blue-400 text-blue-900 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  W
                </span>
              </Button>
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-blue-900 text-blue-100 border-blue-700">
            <div className="text-center">
              <div className="font-semibold">Web Quality</div>
              <div className="text-xs opacity-90">95% • Optimized</div>
              <div className="text-xs opacity-75">Great for sharing & social media</div>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Info Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white bg-gray-600/80 hover:bg-gray-700/90 hover:text-white touch-target"
            >
              <Info className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-gray-900 text-gray-100 border-gray-700 max-w-xs">
            <div className="space-y-2">
              <div className="font-semibold">Download Options:</div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span><strong>Original:</strong> 100% quality, full resolution</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span><strong>Web:</strong> 95% quality, optimized size</span>
                </div>
              </div>
              <div className="text-xs opacity-75 pt-1 border-t border-gray-700">
                Choose Original for professional use, Web for sharing
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}