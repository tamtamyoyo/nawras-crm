import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuthHook';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase-client';
import * as offlineDataService from '@/services/offlineDataService';
import { isOfflineMode } from '../utils/offlineMode'
import { handleSupabaseError } from '../utils/errorHandling'
import { protectFromExtensionInterference } from '../utils/extensionProtection'
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { deals, leads, customers } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        protectFromExtensionInterference()
        
        if (isOfflineMode()) {
          await Promise.all([
            offlineDataService.getDeals(),
            offlineDataService.getLeads(),
            offlineDataService.getCustomers()
          ]);
        } else {
          try {
            await Promise.all([
              supabase.from('deals').select('*').order('created_at', { ascending: false }).limit(10),
              supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(10),
              supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(10)
            ]);
          } catch (supabaseError) {
            console.warn('Supabase error, checking fallback:', supabaseError)
            const shouldFallback = handleSupabaseError(supabaseError, 'dashboard data loading')
            
            if (shouldFallback) {
              // Fallback to offline data
              await Promise.all([
                offlineDataService.getDeals(),
                offlineDataService.getLeads(),
                offlineDataService.getCustomers()
              ]);
              toast.info('Loading data from offline storage')
            } else {
              throw supabaseError
            }
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load dashboard data')
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const totalDeals = deals?.length || 0;
  const totalLeads = leads?.length || 0;
  const totalCustomers = customers?.length || 0;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        {isAuthenticated && user && (
          <p className="text-gray-600 mt-2">Welcome back, {user.name}!</p>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Deals</h3>
          <p className="text-3xl font-bold text-blue-600">{totalDeals}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Leads</h3>
          <p className="text-3xl font-bold text-green-600">{totalLeads}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Customers</h3>
          <p className="text-3xl font-bold text-purple-600">{totalCustomers}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={[]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deals Pipeline</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="deals" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Sources</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[]}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#0088FE" />
                <Cell fill="#00C49F" />
                <Cell fill="#FFBB28" />
                <Cell fill="#FF8042" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}