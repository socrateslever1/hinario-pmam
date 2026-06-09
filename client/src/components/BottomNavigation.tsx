import { Music, Radio, FileText, User, Home } from 'lucide-react';
import { useLocation } from 'wouter';
import { getStudentSession } from '@/lib/studentSession';
import { useState, useEffect } from 'react';

// Evento customizado para notificar mudanças de sessão
const SESSION_CHANGE_EVENT = 'studentSessionChanged';

export const notifySessionChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  }
};

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const [isStudent, setIsStudent] = useState(false);

  // Verificar sessão ao montar e quando a localização muda (para reagir a login/logout)
  useEffect(() => {
    const session = getStudentSession();
    setIsStudent(!!session);
  }, [location]);

  // Ouvir eventos de mudança de sessão
  useEffect(() => {
    const handleSessionChange = () => {
      const session = getStudentSession();
      setIsStudent(!!session);
    };

    window.addEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
    return () => window.removeEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
  }, []);

  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: Music, label: 'Hinos', path: '/hinos' },
    { icon: Radio, label: 'Charlie Mike', path: '/charlie-mike' },
    ...(isStudent ? [
      { icon: FileText, label: 'Notas', path: '/lançar-notas' },
      { icon: User, label: 'Perfil', path: '/perfil-aluno' },
    ] : []),
  ];

  const isActive = (path: string) => {
    return location === path || location.startsWith(path + '/');
  };

  // Não renderizar em desktop
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return null;
  }

  return (
    <nav className="fixed bottom-4 left-4 right-4 md:hidden z-50">
      <div className="flex justify-around items-end gap-2 px-4 py-3 rounded-full bg-[#1a3a2a]/85 backdrop-blur-md shadow-2xl border border-white/10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                active
                  ? 'text-white scale-110'
                  : 'text-white/60 hover:text-white/80'
              }`}
              title={item.label}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
