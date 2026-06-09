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
    // Para notas, considerar ambas as rotas como ativas
    if (path === '/lançar-notas') {
      return location === '/lançar-notas' || location === '/notas-do-curso' || location.startsWith('/lançar-notas/');
    }
    return location === path || location.startsWith(path + '/');
  };

  // Não renderizar em desktop
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 shadow-lg">
      <div className="flex justify-around items-center h-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                active
                  ? 'text-[#1a3a2a] bg-[#c4a84b]/10 border-t-2 border-[#1a3a2a]'
                  : 'text-gray-600 hover:text-[#1a3a2a] hover:bg-gray-50'
              }`}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
