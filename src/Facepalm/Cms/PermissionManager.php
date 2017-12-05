<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 16.05.16
 * Time: 19:54
 */

namespace Facepalm\Cms;


use Facepalm\Cms\Config\Config;
use Facepalm\Models\User;
use Illuminate\Support\Arr;

class PermissionManager
{
    protected $user;


    /**
     * @param Config $config
     * @return Config
     */
    public function filterCmsStructureWithPermissions(User $user, Config $config)
    {
        $this->user = $user;
        if ($this->user && $this->user->role) {
            if ($this->user->role->id !== 1) {
                $acl = $this->user->acl ? json_decode($this->user->acl, true) : [];

                $structure = $config->get('structure');
                if (!$acl || !Arr::has($acl, '/')) {
                    $structure = [];
                }
                foreach ($structure as $sectionName => $data) {
                    if (!array_key_exists($sectionName, $acl)) {
                        unset($structure[$sectionName]);
                    } else {
                        if (array_key_exists('sections', $structure[$sectionName])) {
                            foreach ($structure[$sectionName]['sections'] as $subSectionName => $dataNested) {
                                if (!array_key_exists($sectionName . '/' . $subSectionName, $acl)) {
                                    unset($structure[$sectionName]['sections'][$subSectionName]);
                                }
                            }
                        }
                    }
                }
                $config->set('structure', $structure);
            }
        } else {
            $config->set('structure', []);
        }
        return $config;
    }

    /**
     * @param Config $config
     * @param $group
     * @param $module
     */
    public function checkAccess(Config $config, $group, $module)
    {
        if (!$config->get('structure')) {
//            abort(403);
        }
    }

}