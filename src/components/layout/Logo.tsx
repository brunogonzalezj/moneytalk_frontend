import { DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <Link to="/" className="flex items-center">
      <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-[0_2px_6px_-1px_rgba(5,150,105,0.5)]">
        <DollarSign size={20} strokeWidth={2.5} />
      </div>
      <span className="ml-2 text-xl font-extrabold tracking-[-0.03em] text-primary-700 dark:text-primary-300">MoneyTalk</span>
    </Link>
  );
};

export default Logo;
