<?php

namespace App\DTO\Cloudflare;

readonly class StreamVideoMetadata
{
    public function __construct(
        public string $uid,
        public string $status,
        public bool $isReady,
        public float $durationSeconds,
        public string $formattedDuration,
        public string $thumbnailUrl,
        public string $previewIframeUrl,
        public ?string $playbackHlsUrl = null,
        public bool $requireSignedUrls = false,
        public ?int $width = null,
        public ?int $height = null,
        public ?int $sizeBytes = null,
        public ?string $createdAt = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'uid' => $this->uid,
            'status' => $this->status,
            'is_ready' => $this->isReady,
            'duration_seconds' => $this->durationSeconds,
            'formatted_duration' => $this->formattedDuration,
            'require_signed_urls' => $this->requireSignedUrls,
            'thumbnail_url' => $this->thumbnailUrl,
            'preview_iframe_url' => $this->previewIframeUrl,
            'playback_hls_url' => $this->playbackHlsUrl,
            'meta' => [
                'width' => $this->width,
                'height' => $this->height,
                'size_bytes' => $this->sizeBytes,
            ],
            'created_at' => $this->createdAt,
        ];
    }
}
