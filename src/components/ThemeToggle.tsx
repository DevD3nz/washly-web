import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';

export function ThemeToggle() {
  const { resolved, toggle } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      className="!px-2.5 !py-2"
      onClick={toggle}
      aria-label={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {resolved === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
