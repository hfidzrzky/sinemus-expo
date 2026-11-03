import { useState } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

export function useDownloadTicketPdf() {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadTicketPdf = async (orderId: string, defaultFilename?: string) => {
    setIsDownloading(true);
    toast.info('Menyiapkan file PDF tiket resmi...');

    try {
      const response = await apiClient.get(`/user/tickets/${orderId}/pdf`, {
        responseType: 'blob',
        headers: {
          Accept: 'application/pdf',
        },
      });

      // Ekstrak nama file dari Content-Disposition jika tersedia
      let filename = defaultFilename || `Sinemus-Ticket-${orderId}.pdf`;
      const disposition = response.headers['content-disposition'];
      if (disposition && typeof disposition === 'string') {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Trigger download via temporary Object URL
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('File PDF tiket berhasil diunduh.');
    } catch {
      toast.error('Gagal mengunduh file PDF. Silakan coba beberapa saat lagi.');
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    downloadTicketPdf,
    isDownloading,
  };
}
