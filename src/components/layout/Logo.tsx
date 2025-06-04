import { DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <Link to="/" className="flex items-center">
      <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white">
        <DollarSign size={18} />
      </div>
      <span className="ml-2 text-xl font-bold text-primary-600">MoneyTalk</span>
    </Link>
  );
};

export default Logo;