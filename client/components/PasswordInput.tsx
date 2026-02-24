import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
  buttonClassName?: string;
  errorClassName?: string;
  showErrorMessage?: boolean;
}

export function PasswordInput({
  error,
  containerClassName = "",
  labelClassName = "",
  buttonClassName = "",
  errorClassName = "",
  showErrorMessage = true,
  className = "",
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={containerClassName}>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          {...props}
          className={`${className} pr-12`}
        />

        <button
          type="button"
          onClick={togglePasswordVisibility}
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition p-1 ${buttonClassName}`}
          aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>

      {error && showErrorMessage && (
        <p className={`text-red-600 text-sm mt-1 flex items-center gap-1 ${errorClassName}`}>
          {error}
        </p>
      )}
    </div>
  );
}

export default PasswordInput;
