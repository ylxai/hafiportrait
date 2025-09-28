'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Key } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { UseMutationResult } from "@tanstack/react-query";

interface AccessCodeFormProps {
  selectedAlbum: string;
  verifyCodeMutation: UseMutationResult<any, Error, string, unknown>;
}

export default function AccessCodeForm({ selectedAlbum, verifyCodeMutation }: AccessCodeFormProps) {
  const isMobile = useIsMobile();
  const [accessCode, setAccessCode] = useState("");

  const handleVerifyCode = () => {
    verifyCodeMutation.mutate(accessCode);
  };

  return (
    <Card className={`mb-6 mx-auto ${isMobile ? 'mobile-card' : 'max-w-md'}`}>
      <CardHeader className={isMobile ? 'mobile-card-header' : ''}>
        <CardTitle className={`flex items-center gap-2 ${
          isMobile ? 'mobile-card-title text-lg' : ''
        }`}>
          <Lock className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
          Masukkan Kode Akses
        </CardTitle>
      </CardHeader>
      <CardContent className={`space-y-4 ${isMobile ? 'mobile-card-content' : ''}`}>
        <p className={`text-gray-600 ${isMobile ? 'text-sm leading-relaxed' : 'text-sm'}`}>
          Album "{selectedAlbum}" memerlukan kode akses untuk mengupload foto. 
          Dapatkan kode dari penyelenggara acara.
        </p>
        <div className={`flex ${isMobile ? 'gap-3' : 'gap-2'}`}>
          <Input
            type="text"
            placeholder="Masukkan kode akses"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            className={`uppercase ${isMobile ? 'mobile-input text-lg' : ''}`}
          />
          <Button
            onClick={handleVerifyCode}
            disabled={!accessCode.trim() || verifyCodeMutation.isPending}
            className={isMobile ? 'mobile-button px-4' : ''}
          >
            <Key className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}