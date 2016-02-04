<?php
namespace Tests;


use App\Facepalm\Tools\Path;

class PathTest extends TestCase
{

    /**
     */
    public function testGenerateHierarchicalPrefixDefault()
    {
        $prefix = Path::generateHierarchicalPrefix('abcdefg');
        $this->assertEquals('a/ab/abcdefg', $prefix);
    }

    /**
     */
    public function testGenerateHierarchicalPrefixParameters()
    {
        $prefix = Path::generateHierarchicalPrefix('abcdefg', 3, ".", true);
        $this->assertEquals('a.ab.abc.', $prefix);
    }
}
