import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { ErrorLog } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  Clock
} from "lucide-react";

export default function AdminErrorLogs() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [filteredErrors, setFilteredErrors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [codeFilter, setCodeFilter] = useState('all');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    filterErrors();
  }, [errors, searchTerm, statusFilter, codeFilter]);

  const checkAdminAccess = async () => {
    try {
      const currentUser = await User.me();
      if (currentUser.role !== 'admin') {
        navigate(createPageUrl("Dashboard"));
        return;
      }
      await loadErrors();
    } catch (error) {
      navigate(createPageUrl("SuperAdmin"));
    }
    setLoading(false);
  };

  const loadErrors = async () => {
    try {
      const allErrors = await ErrorLog.list('-created_date', 100);
      setErrors(allErrors);
    } catch (error) {
      console.error('Error loading error logs:', error);
    }
  };

  const filterErrors = () => {
    let filtered = [...errors];

    if (searchTerm) {
      filtered = filtered.filter(error => 
        error.error_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.error_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.technical_details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.page.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(error => 
        statusFilter === 'resolved' ? error.resolved : !error.resolved
      );
    }

    if (codeFilter !== 'all') {
      filtered = filtered.filter(error => error.error_code === codeFilter);
    }

    setFilteredErrors(filtered);
  };

  const markAsResolved = async (errorId) => {
    try {
      await ErrorLog.update(errorId, { resolved: true });
      await loadErrors();
    } catch (error) {
      console.error('Error updating error log:', error);
    }
  };

  const getErrorCodeColor = (code) => {
    if (code.startsWith('ERR0')) return 'bg-red-100 text-red-800';
    if (code.startsWith('ERR1')) return 'bg-orange-100 text-orange-800';
    if (code.startsWith('ERR2')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const parseBrowserInfo = (browserInfoString) => {
    try {
      return typeof browserInfoString === 'string' ? JSON.parse(browserInfoString) : browserInfoString;
    } catch {
      return { userAgent: browserInfoString || 'Unknown' };
    }
  };

  const uniqueErrorCodes = [...new Set(errors.map(e => e.error_code))];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-amber-700 font-medium">Loading Error Logs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white/95 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate(createPageUrl("AdminDashboard"))}
                className="border-amber-200 hover:bg-amber-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Error Logs</h1>
                  <p className="text-sm text-gray-500">Monitor and resolve user issues</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search errors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={codeFilter} onValueChange={setCodeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Error Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Codes</SelectItem>
                  {uniqueErrorCodes.map(code => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{errors.length}</p>
                    <p className="text-sm text-gray-500">Total Errors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{errors.filter(e => !e.resolved).length}</p>
                    <p className="text-sm text-gray-500">Unresolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{errors.filter(e => e.resolved).length}</p>
                    <p className="text-sm text-gray-500">Resolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error List */}
          <div className="space-y-4">
            {filteredErrors.map((error) => {
              const browserInfo = parseBrowserInfo(error.browser_info);
              
              return (
                <Card key={error.id} className={`${error.resolved ? 'opacity-75' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={getErrorCodeColor(error.error_code)}>
                          {error.error_code}
                        </Badge>
                        <CardTitle className="text-lg">{error.error_title}</CardTitle>
                        {error.resolved && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(error.created_date).toLocaleString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium text-gray-900 mb-2">User Message:</p>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded">{error.error_message}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-gray-900 mb-2">Technical Details:</p>
                        <p className="text-sm text-gray-600 bg-red-50 p-3 rounded font-mono">{error.technical_details}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Page:</p>
                          <p className="text-gray-600">{error.page}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Action:</p>
                          <p className="text-gray-600">{error.action}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">User ID:</p>
                          <p className="text-gray-600">{error.user_id}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Browser:</p>
                          <p className="text-gray-600 truncate">{browserInfo?.userAgent || 'Unknown'}</p>
                        </div>
                      </div>
                      
                      {!error.resolved && (
                        <div className="flex justify-end">
                          <Button 
                            size="sm"
                            onClick={() => markAsResolved(error.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as Resolved
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredErrors.length === 0 && (
            <div className="text-center py-16">
              <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' || codeFilter !== 'all' ? 'No matching errors' : 'No errors logged'}
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || codeFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'User errors will appear here when they occur'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}