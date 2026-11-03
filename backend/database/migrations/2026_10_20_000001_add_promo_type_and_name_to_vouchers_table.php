<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            if (! Schema::hasColumn('vouchers', 'promo_type')) {
                $table->string('promo_type', 32)->default('voucher_code')->after('id')->comment('Type of promotion');
                $table->index('promo_type', 'idx_vouchers_promo_type');
            }
            if (! Schema::hasColumn('vouchers', 'name')) {
                $table->string('name', 255)->nullable()->after('code')->comment('Nama promo (untuk display)');
            }
            if (! Schema::hasColumn('vouchers', 'max_uses_per_user')) {
                $table->unsignedInteger('max_uses_per_user')->nullable()->after('quota_used');
            }
            $table->string('code', 50)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $dropCols = [];
            if (Schema::hasColumn('vouchers', 'promo_type')) {
                $table->dropIndex('idx_vouchers_promo_type');
                $dropCols[] = 'promo_type';
            }
            if (Schema::hasColumn('vouchers', 'name')) {
                $dropCols[] = 'name';
            }
            if (Schema::hasColumn('vouchers', 'max_uses_per_user')) {
                $dropCols[] = 'max_uses_per_user';
            }
            if (! empty($dropCols)) {
                $table->dropColumn($dropCols);
            }
            $table->string('code', 50)->nullable(false)->change();
        });
    }
};
