import { useState, useEffect, useContext } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Progress,
  Chip,
  Button,
  Divider
} from "@heroui/react";
import {
  Activity,
  TrendingUp,
  Calendar,
  Zap,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Clock,
  Target,
  Infinity,
  RefreshCw
} from 'lucide-react';
import { UserDataContext } from '../../context-dash/UserDataContext';

const UsageTab = () => {
  const { userData, loggedInUser } = useContext(UserDataContext);
  const [refreshTime, setRefreshTime] = useState(new Date());

  // Calculate usage percentage
  const getUsagePercentage = () => {
    if (!userData?.api_usage_limit || userData.api_usage_limit === -1) {
      return 0; // Unlimited
    }
    const current = userData?.api_usage_current || 0;
    const limit = userData?.api_usage_limit || 1;
    return Math.min((current / limit) * 100, 100);
  };

  // Get usage status
  const getUsageStatus = () => {
    const percentage = getUsagePercentage();
    if (userData?.api_usage_limit === -1) return 'unlimited';
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    return 'good';
  };

  // Format numbers with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0);
  };

  // Get billing cycle info
  const getBillingCycleInfo = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start: startOfMonth.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      end: endOfMonth.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      daysRemaining: Math.ceil((endOfMonth - now) / (1000 * 60 * 60 * 24))
    };
  };

  const handleRefresh = () => {
    setRefreshTime(new Date());
    // You could add actual refresh logic here if needed
  };

  const usagePercentage = getUsagePercentage();
  const usageStatus = getUsageStatus();
  const billingCycle = getBillingCycleInfo();
  const isUnlimited = userData?.api_usage_limit === -1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Usage</h2>
          <p className="text-gray-600 mt-1">Monitor your API consumption and limits</p>
        </div>
        <Button
          variant="light"
          className="text-brand hover:bg-brand/10"
          startContent={<RefreshCw className="w-4 h-4" />}
          onPress={handleRefresh}
          size="sm"
        >
          Refresh
        </Button>
      </div>

      {/* Current Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Usage Status Card */}
        <Card className="p-4 border-1 border-gray-200" shadow="none">
          <CardBody>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${
                usageStatus === 'unlimited' ? 'bg-purple-100' :
                usageStatus === 'critical' ? 'bg-red-100' :
                usageStatus === 'warning' ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                {usageStatus === 'unlimited' ? (
                  <Infinity className={`w-5 h-5 text-purple-600`} />
                ) : usageStatus === 'critical' ? (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                ) : usageStatus === 'warning' ? (
                  <Activity className="w-5 h-5 text-yellow-600" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Current Usage</h3>
                <p className="text-sm text-gray-500">This billing cycle</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold text-gray-900">
                  {formatNumber(userData?.api_usage_current || 0)}
                </span>
                {!isUnlimited && (
                  <span className="text-sm text-gray-500">
                    of {formatNumber(userData?.api_usage_limit)}
                  </span>
                )}
              </div>
              
              {!isUnlimited && (
                <Progress
                  value={usagePercentage}
                  className="max-w-full"
                  color={
                    usageStatus === 'critical' ? 'danger' :
                    usageStatus === 'warning' ? 'warning' : 'primary'
                  }
                  size="sm"
                />
              )}
              
              <div className="flex justify-between items-center">
                <Chip
                  size="sm"
                  variant="flat"
                  color={
                    usageStatus === 'unlimited' ? 'secondary' :
                    usageStatus === 'critical' ? 'danger' :
                    usageStatus === 'warning' ? 'warning' : 'success'
                  }
                >
                  {isUnlimited ? 'Unlimited' : `${usagePercentage.toFixed(1)}% used`}
                </Chip>
                {!isUnlimited && (
                  <span className="text-xs text-gray-500">
                    {formatNumber((userData?.api_usage_limit || 0) - (userData?.api_usage_current || 0))} remaining
                  </span>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Account Type Card */}
        <Card className="p-4 border-1 border-gray-200" shadow="none">
          <CardBody>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-brand/10">
                <Target className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Plan Details</h3>
                <p className="text-sm text-gray-500">Your subscription</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-lg font-bold text-gray-900 capitalize">
                  {loggedInUser?.account_type || 'Basic'} Plan
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">API Limit:</span>
                  <span className="font-medium text-gray-900">
                    {isUnlimited ? 'Unlimited' : formatNumber(userData?.api_usage_limit || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <Chip size="sm" color="success" variant="flat">
                    Active
                  </Chip>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Billing Cycle Card */}
        <Card className="p-4 border-1 border-gray-200" shadow="none">
          <CardBody>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-orange-100">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Billing Cycle</h3>
                <p className="text-sm text-gray-500">Current period</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Period:</span>
                  <span className="font-medium text-gray-900">
                    {billingCycle.start} - {billingCycle.end}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Days remaining:</span>
                  <span className="font-medium text-gray-900">
                    {billingCycle.daysRemaining}
                  </span>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Resets on {billingCycle.end}</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Usage Alerts */}
      {!isUnlimited && (
        <Card className="p-4 border-1 border-gray-200" shadow="none">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">Usage Alerts</h3>
            </div>
          </CardHeader>
          <CardBody className="pt-2">
            <div className="space-y-3">
              {usageStatus === 'critical' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Critical Usage Alert
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        You've used over 90% of your API limit. Consider upgrading your plan to avoid service interruption.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {usageStatus === 'warning' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Activity className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        High Usage Warning
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        You've used over 75% of your API limit. Monitor your usage carefully.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {usageStatus === 'good' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Usage Looking Good
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Your API usage is within normal limits for this billing cycle.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Usage Tips */}
      <Card className="p-4 border-1 border-gray-200" shadow="none">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand" />
            <h3 className="text-lg font-semibold text-gray-900">Optimization Tips</h3>
          </div>
        </CardHeader>
        <CardBody className="pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-brand mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Cache API Responses</p>
                  <p className="text-xs text-gray-600">
                    Implement caching to reduce redundant API calls and save on usage.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-brand mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Monitor Usage Patterns</p>
                  <p className="text-xs text-gray-600">
                    Track your API usage to identify peak times and optimize your requests.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 text-brand mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Set Up Alerts</p>
                  <p className="text-xs text-gray-600">
                    Configure notifications when you reach certain usage thresholds.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Activity className="w-4 h-4 text-brand mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Batch Requests</p>
                  <p className="text-xs text-gray-600">
                    Combine multiple operations into single API calls when possible.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Last Updated */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Last updated: {refreshTime.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default UsageTab;
