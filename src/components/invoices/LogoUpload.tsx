import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, Image } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface LogoUploadProps {
  currentLogo?: string
  onLogoChange: (logoUrl: string | null) => void
  className?: string
}

export function LogoUpload({ currentLogo, onLogoChange, className = '' }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogo || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (PNG, JPG, SVG, etc.)',
        variant: 'destructive'
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive'
      })
      return
    }

    setIsUploading(true)

    try {
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      
      // In a real app, you would upload to a storage service here
      // For now, we'll just use the local preview URL
      onLogoChange(url)
      
      toast({
        title: 'Logo uploaded',
        description: 'Company logo has been updated successfully'
      })
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast({
        title: 'Upload failed',
        description: 'Failed to upload logo. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveLogo = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    onLogoChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    toast({
      title: 'Logo removed',
      description: 'Company logo has been removed'
    })
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Company Logo</h3>
        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveLogo}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <CardContent className="p-6">
          {previewUrl ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Company Logo"
                  className="max-h-32 max-w-full object-contain rounded-lg shadow-sm"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerFileSelect}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Change Logo
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="p-4 bg-gray-100 rounded-full">
                <Image className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Upload Company Logo
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  PNG, JPG, SVG up to 5MB
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={triggerFileSelect}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Choose File'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}