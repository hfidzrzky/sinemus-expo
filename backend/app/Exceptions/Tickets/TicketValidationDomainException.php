<?php

namespace App\Exceptions\Tickets;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketValidationDomainException extends Exception
{
    /**
     * @param  array<string, mixed>  $errors
     */
    public function __construct(
        string $message,
        protected string $errorCode,
        protected array $errors = [],
        int $code = 422,
        ?Exception $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    /**
     * @return array<string, mixed>
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    /**
     * Render the exception into a standard JSON envelope response.
     */
    public function render(Request $request): JsonResponse
    {
        $payload = [
            'success' => false,
            'message' => $this->getMessage(),
            'error_code' => $this->errorCode,
            'server_time' => now()->toISOString(),
        ];

        if (! empty($this->errors)) {
            $payload['errors'] = $this->errors;
        }

        return response()->json($payload, $this->getCode() ?: 422);
    }
}
