<?php
namespace Tests;

use App\Cms\CmsCommon;
use App\Cms\CmsList;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;

class CmsListTest extends TestCase
{
    use DatabaseTransactions;

    /**
     */
    public function testCmsListRequireModelDefinition()
    {
        $this->setExpectedException('Exception', 'No model defined');
        (new CmsList())->display();
    }

    /**
     *
     */
    public function testSetModel()
    {
        $result = (new CmsList())
            ->setMainModel('User')
            ->display();
        $this->assertTrue(is_array($result));
        $this->assertArrayHasKey('meta', $result);
        $this->assertEquals('User', $result['meta']['model']);
    }

    /**
     *
     */
    public function testSetModelLowercase()
    {
        $result = (new CmsList())
            ->setMainModel('user')
            ->display();
        $this->assertTrue(is_array($result));
        $this->assertArrayHasKey('meta', $result);
        $this->assertEquals('User', $result['meta']['model']);
    }

    /**
     *
     */
    public function testSetUnknownModel()
    {
        $this->setExpectedException('Exception', 'Cannot find class');
        (new CmsList())
            ->setMainModel('user2')
            ->display();
    }

    /**
     *
     */
    public function testResultHasAllKeys()
    {
        $this->createDummyUsersData();
        $result = (new CmsList())
            ->setMainModel('User')
            ->display();
        $this->assertTrue(is_array($result));
        $this->assertArrayHasKey('settings', $result);
        $this->assertArrayHasKey('rows', $result);
        $this->assertGreaterThan(1, count($result['rows']));
    }

    /**
     *
     */
    public function testToggleId()
    {
        $list = (new CmsList())
            ->setMainModel('User');

        $result = $list
            ->toggleIdColumn(false)
            ->display();
        $this->assertFalse($result['settings']['showIdColumn']);

        $result = $list
            ->toggleIdColumn(true)
            ->display();
        $this->assertTrue($result['settings']['showIdColumn']);
    }

    /**
     *
     */
    public function testToggleDeleteButtonColumn()
    {
        $list = (new CmsList())
            ->setMainModel('User');

        $result = $list
            ->toggleDeleteButtonColumn(false)
            ->display();
        $this->assertFalse($result['settings']['showDeleteButton']);

        $result = $list
            ->toggleDeleteButtonColumn(true)
            ->display();
        $this->assertTrue($result['settings']['showDeleteButton']);
    }

    /**
     *
     */
    public function testToggleStatusButtonColumn()
    {
        $list = (new CmsList())
            ->setMainModel('User');

        $result = $list
            ->toggleStatusButtonColumn(false)
            ->display();
        $this->assertFalse($result['settings']['showStatusButton']);

        $result = $list
            ->toggleStatusButtonColumn(true)
            ->display();
        $this->assertTrue($result['settings']['showStatusButton']);
    }


    /**
     *
     */
    public function testToggleEditButtonColumn()
    {
        $list = (new CmsList())
            ->setMainModel('User');

        $result = $list
            ->toggleEditButtonColumn(false)
            ->display();
        $this->assertFalse($result['settings']['showEditButton']);

        $result = $list
            ->toggleEditButtonColumn(true)
            ->display();
        $this->assertTrue($result['settings']['showEditButton']);
    }

    /**
     * @throws \Exception
     */
    public function testSetColumns()
    {
        $this->createDummyUsersData();
        $result = (new CmsList())
            ->setMainModel('User')
            ->setColumns([
                'email' => [
                    'title' => 'E-mail'
                ],
                'name' => [
                    'title' => 'Name'
                ],
            ])
            ->display();

        $this->assertEquals(2, count($result['meta']['columns']));
        $this->assertArrayHasKey('email', $result['meta']['columns']);
        $this->assertArrayHasKey('name', $result['meta']['columns']);
        $this->assertEquals('E-mail', $result['meta']['columns']['email']['title']);
        $this->assertEquals('Name', $result['meta']['columns']['name']['title']);
        $this->assertEquals(CmsCommon::COLUMN_TYPE_DEFAULT, $result['meta']['columns']['name']['type']);
        $this->assertArrayHasKey('id', $result['rows'][0]);
        $this->assertArrayHasKey('email', $result['rows'][0]);
        $this->assertArrayHasKey('name', $result['rows'][0]);
    }

    /**
     * @throws \Exception
     */
    public function testSetColumnsTitles()
    {
        $this->createDummyUsersData();
        $result = (new CmsList())
            ->setMainModel('User')
            ->setColumns([
                'email' => [
                ],
                'name' => [
                    'title' => 'Name'
                ],
            ], [
                'email' => 'E-mail',
                'name' => 'WrongName'
            ])
            ->display();

        $this->assertEquals('E-mail', $result['meta']['columns']['email']['title']);
        $this->assertEquals('Name', $result['meta']['columns']['name']['title']);
    }

    /**
     * @throws \Exception
     */
    public function testSetColumnsTitlesArray()
    {
        $this->createDummyUsersData();
        $result = (new CmsList())
            ->setMainModel('User')
            ->setColumns([
                'email' => [
                ],
                'name' => [
                ],
            ], [
                'E-mail',
                'Name'
            ])
            ->display();

        $this->assertEquals('E-mail', $result['meta']['columns']['email']['title']);
        $this->assertEquals('Name', $result['meta']['columns']['name']['title']);
    }

    /**
     * @throws \Exception
     */
    public function testSetColumnsAndTitlesAsArray()
    {
        $this->createDummyUsersData();
        $result = (new CmsList())
            ->setMainModel('User')
            ->setColumns([
                'email',
                'name'
            ], [
                'E-mail',
                'Name'
            ])
            ->display();

        $this->assertEquals('E-mail', $result['meta']['columns']['email']['title']);
        $this->assertEquals('Name', $result['meta']['columns']['name']['title']);
    }

    /**
     * @throws \Exception
     */
    public function testSetColumnsAsArrayWithoutTitles()
    {
        $this->createDummyUsersData();
        $result = (new CmsList())
            ->setMainModel('User')
            ->setColumns([
                'email',
                'name'
            ])
            ->display();

        $this->assertEquals(2, count($result['meta']['columns']));
        $this->assertArrayHasKey('email', $result['meta']['columns']);
        $this->assertArrayHasKey('name', $result['meta']['columns']);
        $this->assertArrayHasKey('email', $result['rows'][0]);
        $this->assertArrayHasKey('name', $result['rows'][0]);
    }

    /**
     * @throws \Exception
     */
    public function testSetColumnAsString()
    {
        $this->createDummyUsersData();
        $result = (new CmsList())
            ->setMainModel('User')
            ->setColumns([
                'email'
            ])
            ->display();

        $this->assertEquals(1, count($result['meta']['columns']));
        $this->assertArrayHasKey('email', $result['meta']['columns']);
        $this->assertArrayHasKey('email', $result['rows'][0]);
    }

    /**
     * @throws \Exception
     */
    public function testSetColumnOverrideName()
    {
        $this->createDummyUsersData();
        $result = (new CmsList())
            ->setMainModel('User')
            ->setColumns([
                'email' => [
                ],
                'name' => [
                    'name'=>'NewName'
                ],
            ])
            ->display();

        $this->assertArrayNotHasKey('name', $result['meta']['columns']);
        $this->assertArrayHasKey('NewName', $result['meta']['columns']);
        $this->assertArrayHasKey('NewName', $result['rows'][0]);
    }

    /**
     * @throws \Exception
     */
    public function testSetColumnType()
    {
        $this->createDummyUsersData();
        $result = (new CmsList())
            ->setMainModel('User')
            ->setColumns([
                'email' => [
                ],
                'name' => [
                    'type'=>CmsCommon::COLUMN_TYPE_TEXT
                ],
            ])
            ->display();

        $this->assertEquals(CmsCommon::COLUMN_TYPE_DEFAULT, $result['meta']['columns']['email']['type']);
        $this->assertEquals(CmsCommon::COLUMN_TYPE_TEXT, $result['meta']['columns']['name']['type']);
    }


    /**
     *
     */
    private function createDummyUsersData()
    {
        $user = new User();
        $user->email = 'test' . Str::quickRandom() . '@test.test';
        $user->save();

    }
}
