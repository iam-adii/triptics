import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TermsAndConditions {
  inclusions: string[];
  exclusions: string[];
  terms: string[];
}

export function TermsConditionsSection() {
  const [termsAndConditions, setTermsAndConditions] = useState<TermsAndConditions>({
    inclusions: [],
    exclusions: [],
    terms: []
  });

  useEffect(() => {
    const fetchTermsAndConditions = async () => {
      try {
        const { data, error } = await supabase
          .from('terms_and_conditions')
          .select('*')
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No records found, which is normal if no terms have been set yet
            console.log('No terms and conditions found');
            return;
          }
          throw error;
        }
        if (data) {
          setTermsAndConditions({
            inclusions: data.inclusions || [],
            exclusions: data.exclusions || [],
            terms: data.terms || []
          });
        }
      } catch (error) {
        console.error('Error fetching terms and conditions:', error);
      }
    };

    fetchTermsAndConditions();
  }, []);

  const hasAnyTerms = termsAndConditions.inclusions.length > 0 || 
                      termsAndConditions.exclusions.length > 0 || 
                      termsAndConditions.terms.length > 0;

  if (!hasAnyTerms) return null;

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-xl font-semibold mb-6">Terms & Conditions</h3>
      
      <div className="space-y-6">
        {/* Inclusions */}
        {termsAndConditions.inclusions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center text-xs">✓</span>
              Inclusions
            </h4>
            <ul className="space-y-1 pl-7">
              {termsAndConditions.inclusions.map((inclusion, index) => (
                <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">•</span>
                  <span>{inclusion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Exclusions */}
        {termsAndConditions.exclusions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
              <span className="w-5 h-5 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-xs">✗</span>
              Exclusions
            </h4>
            <ul className="space-y-1 pl-7">
              {termsAndConditions.exclusions.map((exclusion, index) => (
                <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>{exclusion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Terms & Conditions */}
        {termsAndConditions.terms.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs">📋</span>
              Terms & Conditions
            </h4>
            <ul className="space-y-2 pl-7">
              {termsAndConditions.terms.map((term, index) => (
                <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-blue-600 mt-1">{index + 1}.</span>
                  <span className="whitespace-pre-line">{term}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 