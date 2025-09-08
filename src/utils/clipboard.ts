/**
 * Robust clipboard utility with fallbacks for different browser environments
 */

export interface ClipboardOptions {
  showFallbackPrompt?: boolean;
  fallbackMessage?: string;
}

/**
 * Copy text to clipboard with robust fallback support
 * @param text - Text to copy
 * @param options - Configuration options
 * @returns Promise<boolean> - Success status
 */
export async function copyToClipboard(
  text: string, 
  options: ClipboardOptions = {}
): Promise<boolean> {
  const { 
    showFallbackPrompt = true, 
    fallbackMessage = "Tidak dapat menyalin otomatis. Silakan salin manual:" 
  } = options;

  try {
    // Check if modern clipboard API is available and functional
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Enhanced fallback for HTTP/non-secure contexts
      return await fallbackCopyMethod(text, showFallbackPrompt, fallbackMessage);
    }
  } catch (error) {
    console.error('Clipboard API failed:', error);
    // Try fallback method
    return await fallbackCopyMethod(text, showFallbackPrompt, fallbackMessage);
  }
}

/**
 * Fallback copy method for HTTP/non-secure contexts
 */
async function fallbackCopyMethod(
  text: string, 
  showFallbackPrompt: boolean, 
  fallbackMessage: string
): Promise<boolean> {
  try {
    // Method 1: Try execCommand with better element handling
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Better positioning and styling for mobile compatibility
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    textArea.style.zIndex = '-1';
    
    document.body.appendChild(textArea);
    
    // Focus and select with better mobile support
    textArea.focus();
    textArea.setSelectionRange(0, text.length);
    textArea.select();
    
    // Try execCommand
    let successful = false;
    try {
      successful = document.execCommand('copy');
    } catch (execError) {
      console.log('execCommand failed:', execError);
    }
    
    document.body.removeChild(textArea);
    
    if (successful) {
      return true;
    }
    
    // Method 2: Try selection API
    if (window.getSelection && document.createRange) {
      const range = document.createRange();
      const span = document.createElement('span');
      span.textContent = text;
      span.style.position = 'fixed';
      span.style.top = '0';
      span.style.left = '0';
      span.style.opacity = '0';
      
      document.body.appendChild(span);
      range.selectNode(span);
      
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        
        try {
          successful = document.execCommand('copy');
        } catch (selectionError) {
          console.log('Selection copy failed:', selectionError);
        }
      }
      
      document.body.removeChild(span);
      
      if (successful) {
        return true;
      }
    }
    
    throw new Error('All copy methods failed');
    
  } catch (error) {
    console.error('Fallback copy failed:', error);
    
    // Final fallback - show text for manual copy
    if (showFallbackPrompt) {
      const fullMessage = `${fallbackMessage}\n\n${text}`;
      
      // Try to use a more user-friendly prompt
      if (window.prompt) {
        window.prompt(fullMessage, text);
      } else {
        // Create a temporary modal-like alert
        alert(`${fallbackMessage}\n\nLink: ${text}\n\nSilakan copy link di atas secara manual.`);
      }
    }
    
    return false;
  }
}

/**
 * Check if clipboard API is available
 */
export function isClipboardSupported(): boolean {
  return !!(navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext);
}

/**
 * Copy text with toast notification integration
 * @param text - Text to copy
 * @param type - Type description for toast message
 * @param toast - Toast function from useToast hook
 * @param options - Additional options
 */
export async function copyWithToast(
  text: string,
  type: string,
  toast: (options: any) => void,
  options: ClipboardOptions = {}
): Promise<void> {
  const success = await copyToClipboard(text, options);
  
  if (success) {
    toast({
      title: "✅ Berhasil Disalin!",
      description: `${type} telah disalin ke clipboard.`,
    });
  } else {
    toast({
      title: "❌ Gagal Menyalin",
      description: `Tidak dapat menyalin ${type}. Teks ditampilkan untuk disalin manual.`,
      variant: "destructive",
    });
  }
}