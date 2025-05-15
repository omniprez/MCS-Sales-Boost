import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';

export default function BulkUploadDeals() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!hasRole('admin')) return null; // Only admins can see

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/bulk-upload-deals', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to upload file' }));
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        toast({
          title: "Success",
          description: `Successfully processed ${data.deals.length} deals`,
        });
      } else {
        toast({
          title: "Warning",
          description: "Some deals could not be processed. Check the results for details.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to upload file',
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg mb-8">
      <h2 className="text-xl font-bold mb-4">Bulk Upload Deals</h2>
      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileChange} 
        className="mb-4"
        disabled={uploading}
      />

      {uploading && (
        <div className="text-blue-600 mt-2">Uploading...</div>
      )}

      {result && (
        <div className="mt-4">
          <div className={result.success ? "text-green-700" : "text-amber-600"}>
            {result.message}
          </div>
          {result.deals && (
            <div className="mt-2">
              <div className="font-semibold">Processed Deals:</div>
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Customer</th>
                    <th className="border px-2 py-1">MRC</th>
                    <th className="border px-2 py-1">NRC</th>
                    <th className="border px-2 py-1">TCV</th>
                    <th className="border px-2 py-1">Category</th>
                    <th className="border px-2 py-1">Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {result.deals.map((deal: any, i: number) => (
                    <tr key={i}>
                      <td className="border px-2 py-1">{deal.customer_name}</td>
                      <td className="border px-2 py-1">{deal.mrc}</td>
                      <td className="border px-2 py-1">{deal.nrc}</td>
                      <td className="border px-2 py-1">{deal.tcv}</td>
                      <td className="border px-2 py-1">{deal.category}</td>
                      <td className="border px-2 py-1">{deal.stage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {result.errors && result.errors.length > 0 && (
            <div className="mt-4">
              <div className="font-semibold text-red-600">Errors:</div>
              <ul className="list-disc list-inside text-sm text-red-600">
                {result.errors.map((err: any, i: number) => (
                  <li key={i}>{err.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <a href="/test-deals.csv" download>Download sample CSV template</a>
      </div>
    </div>
  );
} 