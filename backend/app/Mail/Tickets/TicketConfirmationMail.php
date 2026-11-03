<?php

namespace App\Mail\Tickets;

use App\Models\EventTransaction;
use App\Services\Admin\Settings\SystemSettingService;
use App\Services\Tickets\TicketEmailPayloadBuilder;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Data payload view email yang sudah terstruktur dan terisolasi.
     *
     * @var array<string, mixed>
     */
    public array $payload;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public EventTransaction $transaction
    ) {
        $builder = app(TicketEmailPayloadBuilder::class);
        $this->payload = $builder->build($this->transaction);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $settingService = app(SystemSettingService::class);
        $publicContact = $settingService->getPublicContact();

        $fromAddress = ! empty($publicContact['ticket_sender_email'])
            ? (string) $publicContact['ticket_sender_email']
            : (string) config('mail.from.address', 'sinemus.screen@gmail.com');

        $fromName = ! empty($publicContact['ticket_sender_name'])
            ? (string) $publicContact['ticket_sender_name']
            : (string) config('mail.from.name', 'Sinemus Screen');

        return new Envelope(
            from: new Address($fromAddress, $fromName),
            subject: (string) ($this->payload['subject'] ?? 'Konfirmasi Tiket Sinemus Screen'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $viewName = (string) ($this->payload['viewTemplate'] ?? 'emails.tickets.regular-event');

        return new Content(
            view: $viewName,
            with: $this->payload,
        );
    }

    /**
     * Get the attachments for the message (Kosong: PDF diunduh via tombol web on-demand).
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
