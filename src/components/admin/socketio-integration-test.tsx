'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Server, 
  Clock, 
  Users, 
  MessageSquare,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { realtimeUtils, useRealtimeProvider } from '@/lib/realtime-provider';
import { getSocketIOClient } from '@/lib/socketio-client';

interface ServerStats {
  status: string;
  timestamp: string;
  connections?: number;
  uptime?: number;
  stats?: {
    connectedClients: number;
    totalConnections: number;
    messagesReceived: number;
    messagesSent: number;
    memory?: any;
  };
}

export default function SocketIOIntegrationTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [serverStats, setServerStats] = useState<ServerStats | null>(null);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [socketId, setSocketId] = useState<string>('');
  const [transport, setTransport] = useState<string>('');
  
  const { provider, isSocketIO, features } = useRealtimeProvider();
  
  // Test Socket.IO connection
  const testConnection = async () => {
    setConnectionStatus('connecting');
    setTestResults([]);
    
    try {
      const client = getSocketIOClient();
      
      // Listen for connection events
      client.on('connected', () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setSocketId(client.getStatus());
        addTestResult('✅ Socket.IO connected successfully', 'success');
      });
      
      client.on('disconnected', () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        addTestResult('🔌 Socket.IO disconnected', 'info');
      });
      
      client.on('error', (error: any) => {
        setConnectionStatus('error');
        addTestResult(`❌ Connection error: ${error}`, 'error');
      });
      
      client.on('server-info', (info: any) => {
        setTransport(info.transport || 'unknown');
        addTestResult(`📡 Server info received: ${info.transport}`, 'success');
      });
      
      // Test message sending
      client.send('test-message', {
        type: 'integration-test',
        message: 'Hello from HafiPortrait admin',
        timestamp: new Date().toISOString()
      });
      
      addTestResult('📤 Test message sent', 'info');
      
    } catch (error) {
      setConnectionStatus('error');
      addTestResult(`💥 Connection failed: ${error}`, 'error');
    }
  };
  
  // Fetch server health
  const fetchServerHealth = async () => {
    try {
      const response = await fetch('https://wbs.zeabur.app/health');
      if (response.ok) {
        const stats = await response.json();
        setServerStats(stats);
        addTestResult('✅ Server health check passed', 'success');
      }
    } catch (error) {
      addTestResult(`❌ Health check failed: ${error}`, 'error');
    }
  };
  
  // Add test result
  const addTestResult = (message: string, type: 'success' | 'error' | 'info') => {
    const result = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };
  
  // Switch to Socket.IO
  const enableSocketIO = () => {
    realtimeUtils.enableSocketIO();
  };
  
  // Switch to WebSocket
  const enableWebSocket = () => {
    realtimeUtils.enableWebSocket();
  };
  
  // Clear override
  const clearOverride = () => {
    realtimeUtils.clearOverride();
  };
  
  // Auto-test on mount if Socket.IO is enabled
  useEffect(() => {
    if (isSocketIO) {
      testConnection();
      fetchServerHealth();
    }
  }, [isSocketIO]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Socket.IO Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Provider */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Provider</label>
              <Badge variant={isSocketIO ? "default" : "secondary"} className="w-full justify-center">
                {provider.toUpperCase()}
              </Badge>
            </div>
            
            {/* Connection Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Connection Status</label>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(connectionStatus)}`}></div>
                <span className="text-sm capitalize">{connectionStatus}</span>
              </div>
            </div>
            
            {/* Socket ID */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Socket ID</label>
              <code className="text-xs bg-gray-100 p-1 rounded block truncate">
                {socketId || 'Not connected'}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Provider Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={enableSocketIO}
              variant={isSocketIO ? "default" : "outline"}
              size="sm"
            >
              <Wifi className="w-4 h-4 mr-2" />
              Enable Socket.IO
            </Button>
            <Button 
              onClick={enableWebSocket}
              variant={!isSocketIO ? "default" : "outline"}
              size="sm"
            >
              <WifiOff className="w-4 h-4 mr-2" />
              Enable WebSocket
            </Button>
            <Button 
              onClick={clearOverride}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          </div>
          
          {/* Features */}
          <div className="mt-4">
            <label className="text-sm font-medium">Available Features</label>
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(features).map(([feature, enabled]) => (
                <Badge 
                  key={feature} 
                  variant={enabled ? "default" : "outline"}
                  className="text-xs"
                >
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Server Stats */}
      {serverStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Server Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {serverStats.connections || serverStats.stats?.connectedClients || 0}
                </div>
                <div className="text-sm text-gray-600">Connected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {serverStats.stats?.totalConnections || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Total Connections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {serverStats.stats?.messagesReceived || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Messages Received</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.floor((serverStats.uptime || 0) / 3600)}h
                </div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Test Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={testConnection} disabled={connectionStatus === 'connecting'}>
              {connectionStatus === 'connecting' ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button onClick={fetchServerHealth} variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              Check Health
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testResults.map((result) => (
                <div key={result.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm">
                  {getResultIcon(result.type)}
                  <div className="flex-1">
                    <div>{result.message}</div>
                    <div className="text-xs text-gray-500">{result.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>Socket.IO Server:</strong> https://wbs.zeabur.app</div>
            <div><strong>Transport:</strong> {transport || 'WebSocket with polling fallback'}</div>
            <div><strong>Environment:</strong> {process.env.NODE_ENV}</div>
            <div><strong>Status:</strong> {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}