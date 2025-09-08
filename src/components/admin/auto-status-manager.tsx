'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Clock, 
  Archive, 
  Play, 
  CheckCircle,
  AlertTriangle,
  Zap,
  Settings,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AutoStatusManagerProps {
  onRefresh?: () => void;
}

export function AutoStatusManager({ onRefresh }: AutoStatusManagerProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastHealthCheck, setLastHealthCheck] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const runHealthCheck = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/admin/events/auto-status?action=health-check");
      const result = await response.json();
      
      setLastHealthCheck(result);
      
      // Trigger auto status notification event
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('auto-status-completed', {
          detail: {
            type: 'health-check',
            result,
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(event);
      }
      
      toast({
        title: "Health Check Completed! 🔍",
        description: `Processed ${result.summary.totalProcessed} events, ${result.archiveSuggestions.length} suggestions`,
      });

      if (onRefresh) onRefresh();
    } catch (error) {
      toast({
        title: "Health Check Failed",
        description: "Terjadi kesalahan saat menjalankan health check.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runAutoComplete = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/admin/events/auto-status?action=auto-complete");
      const result = await response.json();
      
      // Trigger auto status notification event
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('auto-status-completed', {
          detail: {
            type: 'auto-complete',
            result,
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(event);
      }
      
      toast({
        title: "Auto-Complete Finished! ✅",
        description: `${result.processed} expired events marked as completed`,
      });

      if (onRefresh) onRefresh();
    } catch (error) {
      toast({
        title: "Auto-Complete Failed",
        description: "Gagal menjalankan auto-complete events.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runAutoActivate = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/admin/events/auto-status?action=auto-activate");
      const result = await response.json();
      
      toast({
        title: "Auto-Activate Finished! 🚀",
        description: `${result.processed} today events activated`,
      });

      if (onRefresh) onRefresh();
    } catch (error) {
      toast({
        title: "Auto-Activate Failed",
        description: "Gagal menjalankan auto-activate events.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/admin/events/auto-status?action=suggest-archive");
      const result = await response.json();
      
      setSuggestions(result.suggestions);
      
      toast({
        title: "Archive Suggestions Ready! 💡",
        description: `Found ${result.suggestions.length} events ready for archive`,
      });
    } catch (error) {
      toast({
        title: "Failed to Get Suggestions",
        description: "Gagal mendapatkan saran archive.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const bulkArchive = async (eventIds: string[]) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/admin/events/auto-status", {
        action: "bulk-archive",
        eventIds
      });
      const result = await response.json();
      
      toast({
        title: "Bulk Archive Completed! 📦",
        description: `${result.summary.successful}/${result.summary.total} events archived successfully`,
      });

      setSuggestions([]); // Clear suggestions
      if (onRefresh) onRefresh();
    } catch (error) {
      toast({
        title: "Bulk Archive Failed",
        description: "Gagal menjalankan bulk archive.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-wedding-gold/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-wedding-gold" />
          Auto Status Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Otomatisasi pengelolaan status event berdasarkan tanggal dan aktivitas
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={runHealthCheck}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Health Check
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={runAutoComplete}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Auto Complete
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={runAutoActivate}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Auto Activate
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={getSuggestions}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Archive className="w-4 h-4" />
            Get Suggestions
          </Button>
        </div>

        {/* Last Health Check Results */}
        {lastHealthCheck && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Last Health Check Results
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-lg font-semibold text-green-600">
                  {lastHealthCheck.autoComplete.processed}
                </div>
                <div className="text-sm text-green-800">Auto Completed</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-lg font-semibold text-blue-600">
                  {lastHealthCheck.autoActivate.processed}
                </div>
                <div className="text-sm text-blue-800">Auto Activated</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-lg font-semibold text-orange-600">
                  {lastHealthCheck.archiveSuggestions.length}
                </div>
                <div className="text-sm text-orange-800">Archive Suggestions</div>
              </div>
            </div>
            
            {lastHealthCheck.summary.errors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-800">Errors Found</span>
                </div>
                <div className="text-sm text-red-700">
                  {lastHealthCheck.summary.errors.length} events failed to process
                </div>
              </div>
            )}
          </div>
        )}

        {/* Archive Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Archive className="w-4 h-4" />
                Archive Suggestions ({suggestions.length})
              </h4>
              <Button
                size="sm"
                onClick={() => bulkArchive(suggestions.map(s => s.eventId))}
                disabled={isLoading}
                className="bg-wedding-gold hover:bg-wedding-gold/90 text-black"
              >
                Archive All
              </Button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <div key={suggestion.eventId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{suggestion.eventName}</div>
                    <div className="text-sm text-gray-600">
                      {suggestion.daysSinceCompletion} days since completion
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                      <Clock className="w-3 h-3 mr-1" />
                      {suggestion.daysSinceCompletion}d
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => bulkArchive([suggestion.eventId])}
                      disabled={isLoading}
                    >
                      Archive
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto Status Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Auto Status Rules:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Auto Complete</strong>: Events aktif yang sudah lewat 24 jam</li>
            <li>• <strong>Auto Activate</strong>: Events draft yang tanggalnya hari ini</li>
            <li>• <strong>Archive Suggestions</strong>: Events selesai lebih dari 7 hari</li>
            <li>• <strong>Health Check</strong>: Jalankan semua rule sekaligus</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}