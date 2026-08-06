import { getAllFeatureFlags } from "@/lib/feature-flags";
import { getAllSiteSettings } from "@/lib/site-settings";
import { FlagToggle } from "@/components/admin/flag-toggle";
import { SiteSettingField } from "@/components/admin/site-setting-field";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { Card } from "@/components/ui/card";

export default async function AdminSettingsPage() {
  await requireSuperAdmin();
  const [flags, settings] = await Promise.all([getAllFeatureFlags(), getAllSiteSettings()]);

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800">Settings</h1>
      <p className="mt-1 text-sm text-slate-500">Feature flags and site configuration, editable without a redeploy.</p>

      <h2 className="mt-6 text-sm font-bold text-slate-800">Feature flags</h2>
      <Card className="mt-2 gap-0 divide-y divide-slate-100 rounded-2xl p-0 shadow-sm">
        {flags.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No flags yet.</p>
        ) : (
          flags.map((flag) => <FlagToggle key={flag.key} flag={flag} />)
        )}
      </Card>

      <h2 className="mt-6 text-sm font-bold text-slate-800">Site settings</h2>
      <Card className="mt-2 gap-0 divide-y divide-slate-100 rounded-2xl p-0 shadow-sm">
        {settings.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No settings yet.</p>
        ) : (
          settings.map((setting) => <SiteSettingField key={setting.key} setting={setting} />)
        )}
      </Card>
    </div>
  );
}
