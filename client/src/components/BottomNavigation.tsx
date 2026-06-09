import { Music, Radio, FileText, User, Home, BookOpen, Settings, LogOut } from 'lucide-react';
import { useLocation } from 'wouter';
import { getStudentSession, clearStudentSession } from '@/lib/studentSession';
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
    { icon: BookOpen, label: 'Estudos', path: '/estudos' },
    ...(isStudent ? [
      { icon: FileText, label: 'Notas', path: '/lançar-notas' },
      { icon: User, label: 'Perfil', path: '/perfil-aluno' },
    ] : []),
    { icon: Settings, label: 'Sobre', path: '/sobre' },
  ];

  const isActive = (path: string) => {
    return location === path || location.startsWith(path + '/');
  };

  const handleLogout = () => {
    clearStudentSession();
    notifySessionChange();
    setLocation('/entrar');
  };

  // Não renderizar em desktop
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return null;
  }

  return (
    <nav className="fixed bottom-3 left-3 right-3 md:hidden z-50">
      <div className="flex justify-between items-center gap-1.5 px-2 py-2 rounded-full bg-[#1a3a2a]/85 backdrop-blur-md shadow-2xl border border-white/10 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                active
                  ? 'text-white scale-105'
                  : 'text-white/60 hover:text-white/80'
              }`}
              title={item.label}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          );
        })}
        {isStudent && (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-all text-red-400 hover:text-red-300 whitespace-nowrap flex-shrink-0"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-[10px] font-medium leading-tight">Sair</span>
          </button>
        )}
      </div>
    </nav>
  );
}
