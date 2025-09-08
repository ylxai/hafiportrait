'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Bug, 
  Home,
  Settings,
  Shield
} from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

export class AdminErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `admin_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    console.error('🚨 Admin Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      componentName: this.props.componentName,
      timestamp: new Date().toISOString()
    });

    // Send error to monitoring service (if available)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Send to monitoring service
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-error', {
          detail: {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            errorId: this.state.errorId,
            componentName: this.props.componentName,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
          }
        }));
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Max retries reached, reload page
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/admin';
  };

  private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' | 'critical' => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'medium';
    }
    if (message.includes('chunk') || message.includes('loading')) {
      return 'low';
    }
    if (message.includes('permission') || message.includes('auth')) {
      return 'high';
    }
    if (message.includes('memory') || message.includes('stack')) {
      return 'critical';
    }
    
    return 'medium';
  };

  private getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const severity = this.getErrorSeverity(this.state.error!);
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 text-red-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-red-900">
                    {this.props.componentName || 'Admin Component'} Error
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-xs ${this.getSeverityColor(severity)}`}>
                      {severity.toUpperCase()} SEVERITY
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Error ID: {this.state.errorId}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Message */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Error Details:</h4>
                <p className="text-sm text-red-800 font-mono">
                  {this.state.error?.message || 'Unknown error occurred'}
                </p>
              </div>

              {/* Retry Information */}
              {this.state.retryCount > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Retry Attempt:</strong> {this.state.retryCount} of {this.maxRetries}
                  </p>
                </div>
              )}

              {/* Suggested Actions */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Suggested Actions:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {canRetry && (
                    <Button
                      onClick={this.handleRetry}
                      variant="default"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry ({this.maxRetries - this.state.retryCount} left)
                    </Button>
                  )}
                  
                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reload Page
                  </Button>
                  
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Go to Dashboard
                  </Button>
                  
                  <Button
                    onClick={() => window.location.href = '/admin/system-monitor'}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    System Monitor
                  </Button>
                </div>
              </div>

              {/* Technical Details (for developers) */}
              {this.props.showDetails && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    <Bug className="inline h-4 w-4 mr-1" />
                    Technical Details (for developers)
                  </summary>
                  <div className="mt-2 p-4 bg-gray-50 border rounded-lg">
                    <div className="space-y-3 text-xs font-mono">
                      <div>
                        <strong>Error Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-red-600">
                          {this.state.error?.stack}
                        </pre>
                      </div>
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-blue-600">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                      <div>
                        <strong>Timestamp:</strong>
                        <span className="ml-2">{new Date().toISOString()}</span>
                      </div>
                    </div>
                  </div>
                </details>
              )}

              {/* Contact Support */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
                <p className="text-sm text-blue-800">
                  If this error persists, please contact support with Error ID: 
                  <code className="ml-1 px-1 bg-blue-200 rounded text-xs">
                    {this.state.errorId}
                  </code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;