import React, { useState } from 'react';
import { Mail, Phone } from 'lucide-react';

interface EmployerContactProps {
  email: string;
  phone?: string;
}

export default function EmployerContact({ email, phone }: EmployerContactProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="mt-4 border-t pt-4">
      {!isVisible ? (
        <button
          onClick={() => setIsVisible(true)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Show employer contact info
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Mail className="h-4 w-4 mr-2 text-gray-500" />
            <a 
              href={`mailto:${email}`}
              className="text-blue-600 hover:text-blue-800"
            >
              {email}
            </a>
          </div>
          {phone && (
            <div className="flex items-center text-sm">
              <Phone className="h-4 w-4 mr-2 text-gray-500" />
              <a 
                href={`tel:${phone}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {phone}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}