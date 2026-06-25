'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Shield, Database, Clipboard, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

/**
 * BROWSER-006: Browser Memory Settings
 * 
 * Features:
 * - Optional browser memory (off by default)
 * - Privacy-first design
 * - Clear consent flow
 * - Clear/delete controls
 * - View stored data
 */

interface BrowserMemorySettings {
  enabled: boolean;
  captureTabs: boolean;
  captureStorage: boolean;
  captureClipboard: boolean;
  captureDownloads: boolean;
}

export default function BrowserMemorySettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BrowserMemorySettings>({
    enabled: false,
    captureTabs: false,
    captureStorage: false,
    captureClipboard: false,
    captureDownloads: false,
  });

  const [stats, setStats] = useState({
    tabs: 0,
    storage: 0,
    clipboard: 0,
    downloads: 0,
  });

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load settings from user preferences
      const { data } = await supabase
        .from('user_preferences')
        .select('browser_memory_settings')
        .eq('user_id', user.id)
        .single();

      if (data?.browser_memory_settings) {
        setSettings(data.browser_memory_settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get counts from neutron tables
      const [tabsRes, storageRes, clipboardRes, downloadsRes] = await Promise.all([
        supabase.from('neutron_tabs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('neutron_storage').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('neutron_clipboard').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('neutron_downloads').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      setStats({
        tabs: tabsRes.count || 0,
        storage: storageRes.count || 0,
        clipboard: clipboardRes.count || 0,
        downloads: downloadsRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in');
        return;
      }

      // Save to user preferences
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          browser_memory_settings: settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Browser memory settings saved');
    } catch (error: any) {
      toast.error(`Failed to save settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const clearData = async (type: 'all' | 'tabs' | 'storage' | 'clipboard' | 'downloads') => {
    if (!confirm(`Are you sure you want to delete all ${type === 'all' ? 'browser memory data' : type}? This cannot be undone.`)) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (type === 'all' || type === 'tabs') {
        await supabase.from('neutron_tabs').delete().eq('user_id', user.id);
      }
      if (type === 'all' || type === 'storage') {
        await supabase.from('neutron_storage').delete().eq('user_id', user.id);
      }
      if (type === 'all' || type === 'clipboard') {
        await supabase.from('neutron_clipboard').delete().eq('user_id', user.id);
      }
      if (type === 'all' || type === 'downloads') {
        await supabase.from('neutron_downloads').delete().eq('user_id', user.id);
      }

      toast.success('Data cleared successfully');
      loadStats();
    } catch (error: any) {
      toast.error(`Failed to clear data: ${error.message}`);
    }
  };

  const viewData = async (type: 'tabs' | 'storage' | 'clipboard' | 'downloads') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let data;
      switch (type) {
        case 'tabs':
          const { data: tabs } = await supabase
            .from('neutron_tabs')
            .select('*')
            .eq('user_id', user.id)
            .order('visited_at', { ascending: false })
            .limit(100);
          data = tabs;
          break;
        case 'storage':
          const { data: storage } = await supabase
            .from('neutron_storage')
            .select('key, captured_at')
            .eq('user_id', user.id)
            .order('captured_at', { ascending: false })
            .limit(100);
          data = storage;
          break;
        case 'clipboard':
          const { data: clipboard } = await supabase
            .from('neutron_clipboard')
            .select('type, length_bytes, captured_at')
            .eq('user_id', user.id)
            .order('captured_at', { ascending: false })
            .limit(100);
          data = clipboard;
          break;
        case 'downloads':
          const { data: downloads } = await supabase
            .from('neutron_downloads')
            .select('name, mime, size, captured_at')
            .eq('user_id', user.id)
            .order('captured_at', { ascending: false })
            .limit(100);
          data = downloads;
          break;
      }

      // Show in modal or new page
      console.log(`${type} data:`, data);
      toast.info(`Viewing ${type} data (check console)`);
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Browser Memory</h1>
        <p className="text-muted-foreground mt-2">
          Control how your browser activity is stored and used
        </p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Browser memory is <strong>disabled by default</strong> for privacy. 
          Enable only if you want to use features that benefit from browser context.
          All data is stored securely and you can delete it at any time.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Enable Browser Memory</CardTitle>
          <CardDescription>
            When enabled, IntegrateWise can capture browser activity to provide better context
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Browser Memory</Label>
              <p className="text-sm text-muted-foreground">
                Master switch for all browser memory features
              </p>
            </div>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => {
                setSettings({ ...settings, enabled: checked });
                if (!checked) {
                  // Disable all when master switch is off
                  setSettings({
                    enabled: false,
                    captureTabs: false,
                    captureStorage: false,
                    captureClipboard: false,
                    captureDownloads: false,
                  });
                }
              }}
            />
          </div>

          {settings.enabled && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tabs" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Capture Tabs
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Store visited URLs and page titles
                  </p>
                </div>
                <Switch
                  id="tabs"
                  checked={settings.captureTabs}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, captureTabs: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="storage" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Capture Storage
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Store localStorage/sessionStorage keys (hashed)
                  </p>
                </div>
                <Switch
                  id="storage"
                  checked={settings.captureStorage}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, captureStorage: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="clipboard" className="flex items-center gap-2">
                    <Clipboard className="h-4 w-4" />
                    Capture Clipboard
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Store clipboard content (requires explicit permission)
                  </p>
                </div>
                <Switch
                  id="clipboard"
                  checked={settings.captureClipboard}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, captureClipboard: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="downloads" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Capture Downloads
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Store download metadata (filename, size, source)
                  </p>
                </div>
                <Switch
                  id="downloads"
                  checked={settings.captureDownloads}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, captureDownloads: checked })
                  }
                />
              </div>
            </div>
          )}

          <Button onClick={saveSettings} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {settings.enabled && (
        <Card>
          <CardHeader>
            <CardTitle>Stored Data</CardTitle>
            <CardDescription>
              View and manage your stored browser memory data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Tabs</p>
                  <p className="text-2xl font-bold">{stats.tabs}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => viewData('tabs')}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => clearData('tabs')}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Storage</p>
                  <p className="text-2xl font-bold">{stats.storage}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => viewData('storage')}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => clearData('storage')}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Clipboard</p>
                  <p className="text-2xl font-bold">{stats.clipboard}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => viewData('clipboard')}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => clearData('clipboard')}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Downloads</p>
                  <p className="text-2xl font-bold">{stats.downloads}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => viewData('downloads')}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => clearData('downloads')}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={() => clearData('all')}
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Browser Memory Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
