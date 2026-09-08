"use client";

import { useState } from "react";
import { LegalLink } from "@/components/legal-drawer";

interface ConsentCheckboxProps {
  onValidation?: (isValid: boolean) => void;
  required?: boolean;
}

export function ConsentCheckbox({ onValidation, required = true }: ConsentCheckboxProps) {
  const [checked, setChecked] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.checked;
    setChecked(value);
    onValidation?.(value);
  };

  return (
    <div className="flex items-start gap-3 py-2">
      <input
        id="consent-checkbox"
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        required={required}
        name="termos_aceitos"
        value="true"
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border-subtle bg-surface-container accent-primary-container"
        aria-label="Aceitar termos e privacidade"
      />
      <label htmlFor="consent-checkbox" className="text-body-md text-text-muted cursor-pointer">
        Li e concordo com os{" "}
        <LegalLink doc="termos" className="text-badge-vip underline underline-offset-2 hover:text-secondary">
          Termos de Uso
        </LegalLink>
        {" "}e a{" "}
        <LegalLink doc="privacidade" className="text-badge-vip underline underline-offset-2 hover:text-secondary">
          Política de Privacidade
        </LegalLink>
        , e confirmo ter mais de 18 anos.
      </label>
    </div>
  );
}
