<?php

namespace App\Http\Resources\Admin\V1\Cloudflare;

use App\DTO\Cloudflare\StreamVideoMetadata;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read StreamVideoMetadata $resource
 */
class StreamVerificationResource extends JsonResource
{
    public static $wrap = null;

    protected ?string $previewToken = null;

    public function withPreviewToken(?string $token): static
    {
        $this->previewToken = $token;

        return $this;
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var StreamVideoMetadata $meta */
        $meta = $this->resource;

        $data = $meta->toArray();
        $data['preview_token'] = $this->previewToken;

        if ($this->previewToken) {
            $data['preview_iframe_url'] = "https://iframe.videodelivery.net/{$this->previewToken}";
            $data['playback_hls_url'] = "https://videodelivery.net/{$this->previewToken}/manifest/video.m3u8";
            $data['thumbnail_url'] = "https://videodelivery.net/{$this->previewToken}/thumbnails/thumbnail.jpg?time=1s&height=240";
        }

        return $data;
    }
}
