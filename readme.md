##Install into existing Laravel 5.4 project
Add repository to composer.json
```
    "repositories": [
        {
            "type": "composer",
            "url": "https://packages.dev.qortex.ru"
        }
    ]
```
Add dependency ``"xpundel\facepalm":"1.8.*"``

Run ``composer update``

Add `Facepalm\Providers\FacepalmServiceProvider::class` to config/app.php

Run ``php artisan facepalm:install``

Enter superuser email/password when asked

Make User model extends `Facepalm\Models\User`

Login to site.url/cms/