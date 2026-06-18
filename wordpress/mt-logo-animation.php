<?php
/**
 * Plugin Name: MT Logo Animation
 * Description: Animazione logo M/T nell'header di Memorie Tangibili.
 * Version: 1.0.0
 * Author: Memorie Tangibili
 */

if (!defined('ABSPATH')) {
    exit;
}

function mt_logo_animation_assets() {
    $base = plugin_dir_url(__FILE__);

    wp_enqueue_style(
        'mt-logo-animation',
        $base . 'logo-animation.css',
        array(),
        '1.0.0'
    );

    wp_enqueue_script(
        'mt-logo-animation',
        $base . 'logo-animation.js',
        array(),
        '1.0.0',
        true
    );
}
add_action('wp_enqueue_scripts', 'mt_logo_animation_assets');
