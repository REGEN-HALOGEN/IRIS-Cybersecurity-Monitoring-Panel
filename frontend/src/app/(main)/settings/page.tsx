import { ThemeToggle } from '@/components/theme-toggle';

export default function SettingsPage() {
  return (
    <div className='flex-1 space-y-4 p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>Settings</h2>
      </div>
      <div className='max-w-4xl space-y-6'>
        <div className='rounded-xl border bg-card text-card-foreground shadow'>
          <div className='flex flex-col space-y-1.5 p-6'>
            <h3 className='font-semibold leading-none tracking-tight'>Appearance</h3>
            <p className='text-sm text-muted-foreground'>Customize the look and feel of your dashboard.</p>
          </div>
          <div className='p-6 pt-0 flex gap-4 items-center'>
            <ThemeToggle />
            <span className='text-sm font-medium'>Toggle Theme Preference</span>
          </div>
        </div>
      </div>
    </div>
  );
}
