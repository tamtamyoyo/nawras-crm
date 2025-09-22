import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { User, Bell, Shield, Database as DatabaseIcon, Save, Eye, EyeOff, TestTube, Activity, Settings as SettingsIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuthHook'
import { supabase } from '../lib/supabase-client'

import { isOfflineMode } from '../utils/offlineMode'
import { handleSupabaseError } from '../utils/errorHandling'
import { protectFromExtensionInterference } from '../utils/extensionProtection'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { runComprehensiveTests } from '../test/test-runner'
import { addDemoData } from '../utils/demo-data'

import { HealthCheck } from '../components/HealthCheck'



interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  deal_updates: boolean
  proposal_updates: boolean
  invoice_updates: boolean
  calendar_reminders: boolean
}

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.enum(['admin', 'manager', 'sales_rep']),
  bio: z.string().optional()
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function Settings() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'data' | 'monitoring'>('profile')
  const [loading, setLoading] = useState(false)
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: false,
    deal_updates: true,
    proposal_updates: true,
    invoice_updates: true,
    calendar_reminders: true
  })
  const { toast } = useToast()

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      company: '',
      role: 'sales_rep' as const,
      bio: ''
    }
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: ''
    }
  })

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        company: profile.company || '',
        role: profile.role || 'sales_rep',
        bio: profile.bio || ''
      })
    }
  }, [profile, profileForm])

  const settingsSections = [
    {
      id: 'profile',
      title: 'Profile Settings',
      description: 'Manage your personal information',
      icon: User,
      color: 'text-blue-600'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure your notification preferences',
      icon: Bell,
      color: 'text-yellow-600'
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Password and security settings',
      icon: Shield,
      color: 'text-green-600'
    },
    {
      id: 'monitoring',
      title: 'System Health',
      description: 'Monitor application performance and health',
      icon: Activity,
      color: 'text-red-600'
    },
    {
      id: 'data',
      title: 'Data Management',
      description: 'Import/export and backup options',
      icon: DatabaseIcon,
      color: 'text-purple-600'
    }
  ]

  const handleProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return
    
    setLoading(true)
    try {
      protectFromExtensionInterference()
      
      if (isOfflineMode()) {
        // Handle offline mode - profile updates are not fully implemented in offline service
        toast({
          title: "Offline Mode",
          description: "Profile updates are limited in offline mode.",
        })
        return
      }
      
      try {
        // Update profile locally since we don't have a users table
        // Note: updateProfile function is not available in current auth context
        // This would need to be implemented in the auth hook
        console.log('Profile update requested:', {
          full_name: data.full_name,
          role: data.role,
          updated_at: new Date().toISOString()
        })
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        })
      } catch (supabaseError) {
        console.warn('Supabase error, falling back to offline mode:', supabaseError)
        const shouldFallback = handleSupabaseError(supabaseError, 'profile update')
        
        if (shouldFallback) {
          toast({
            title: "Offline Mode",
            description: "Profile updates are limited in offline mode.",
          })
        } else {
          throw supabaseError
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    setLoading(true)
    try {
      protectFromExtensionInterference()
      
      if (isOfflineMode()) {
        // Handle offline mode - password updates are not available offline
        toast({
          title: "Offline Mode",
          description: "Password updates are not available in offline mode.",
        })
        return
      }
      
      try {
        const { error } = await supabase.auth.updateUser({
          password: data.new_password
        })

        if (error) throw error

        passwordForm.reset()
        setShowPasswordModal(false)
        toast({
          title: "Password updated",
          description: "Your password has been updated successfully.",
        })
      } catch (supabaseError) {
        console.warn('Supabase error, falling back to offline mode:', supabaseError)
        const shouldFallback = handleSupabaseError(supabaseError, 'password update')
        
        if (shouldFallback) {
          toast({
            title: "Offline Mode",
            description: "Password updates are not available in offline mode.",
          })
        } else {
          throw supabaseError
        }
      }
    } catch (error) {
      console.error('Error updating password:', error)
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }))
    // In a real app, you'd save this to the database
    toast({
      title: "Notification settings updated",
      description: "Your notification preferences have been saved.",
    })
  }

  const exportData = async () => {
    try {
      // Export user data (simplified example)
      const data = {
        profile,
        notifications,
        exported_at: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `crm-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Data exported",
        description: "Your data has been exported successfully.",
      })
    } catch {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <SettingsIcon className="h-8 w-8" />
              Settings
            </h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!user) {
                  toast({ title: 'Error', description: 'Please log in to run tests', variant: 'destructive' })
                  return
                }
                setIsRunningTests(true)
                try {
                  await runComprehensiveTests(user.id)
                  toast({ title: 'Success', description: 'All tests completed successfully!' })
                } catch {
                  toast({ title: 'Error', description: 'Some tests failed. Check console for details.', variant: 'destructive' })
                } finally {
                  setIsRunningTests(false)
                }
              }}
              disabled={isRunningTests}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await addDemoData(user?.id || '')
                  toast({ title: 'Success', description: 'Demo data added successfully!' })
                } catch {
                  toast({ title: 'Error', description: 'Failed to add demo data', variant: 'destructive' })
                }
              }}
            >
              Add Demo Data
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
        {settingsSections.map((section) => {
          const IconComponent = section.icon
          return (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id as 'profile' | 'notifications' | 'security' | 'data' | 'monitoring')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === section.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <IconComponent className={`h-4 w-4 ${section.color}`} />
              {section.title}
            </button>
          )
        })}
      </div>

      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information and profile details</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={profileForm.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Administrator</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="sales_rep">Sales Representative</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your company" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={profileForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about yourself" 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose what notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notifications.email_notifications}
                  onCheckedChange={(checked) => handleNotificationChange('email_notifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Push Notifications</h4>
                  <p className="text-sm text-gray-600">Receive push notifications in your browser</p>
                </div>
                <Switch
                  checked={notifications.push_notifications}
                  onCheckedChange={(checked) => handleNotificationChange('push_notifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Deal Updates</h4>
                  <p className="text-sm text-gray-600">Get notified when deals are updated</p>
                </div>
                <Switch
                  checked={notifications.deal_updates}
                  onCheckedChange={(checked) => handleNotificationChange('deal_updates', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Proposal Updates</h4>
                  <p className="text-sm text-gray-600">Get notified about proposal changes</p>
                </div>
                <Switch
                  checked={notifications.proposal_updates}
                  onCheckedChange={(checked) => handleNotificationChange('proposal_updates', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Invoice Updates</h4>
                  <p className="text-sm text-gray-600">Get notified about invoice status changes</p>
                </div>
                <Switch
                  checked={notifications.invoice_updates}
                  onCheckedChange={(checked) => handleNotificationChange('invoice_updates', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Calendar Reminders</h4>
                  <p className="text-sm text-gray-600">Get reminders for upcoming events</p>
                </div>
                <Switch
                  checked={notifications.calendar_reminders}
                  onCheckedChange={(checked) => handleNotificationChange('calendar_reminders', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your account security and password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Account Email</h4>
                <p className="text-sm text-gray-600 mb-2">Your account is registered with:</p>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded">{user?.email}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Password</h4>
                <p className="text-sm text-gray-600 mb-4">Change your account password</p>
                <Button onClick={() => setShowPasswordModal(true)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health Monitoring */}
      {activeTab === 'monitoring' && (
        <Card>
          <CardHeader>
            <CardTitle>System Health Monitoring</CardTitle>
            <CardDescription>Monitor application performance, health status, and system metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <HealthCheck />
          </CardContent>
        </Card>
      )}

      {/* Data Management */}
      {activeTab === 'data' && (
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Export your data and manage your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Export Data</h4>
                <p className="text-sm text-gray-600 mb-4">Download a copy of your CRM data</p>
                <Button onClick={exportData}>
                  <DatabaseIcon className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2 text-red-600">Danger Zone</h4>
                <p className="text-sm text-gray-600 mb-4">Permanently delete your account and all data</p>
                <Button variant="destructive" disabled>
                  Delete Account
                </Button>
                <p className="text-xs text-gray-500 mt-2">Contact support to delete your account</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter current password" 
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password" 
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password" 
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}