<?php
namespace Tests;

use App\Facepalm\CmsCommon;
use App\Facepalm\Components\CmsList;
use App\Facepalm\Fields\Types\StringField;
use App\Facepalm\Fields\Types\TextField;
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
        (new CmsList())->prepareData();
    }

    /**
     *
     */
    public function testSetModel()
    {
        $result = (new CmsList())
            ->setMainModel('User')
            ->prepareData();
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
            ->prepareData();
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
            ->prepareData();
    }

    /**
     *
     */
    public function testResultHasAllKeys()
    {
        $this->createDummyUsersData();
        $result = (new CmsList())
            ->setMainModel('User')
            ->prepareData();
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
            ->prepareData();
        $this->assertFalse($result['settings']['showIdColumn']);

        $result = $list
            ->toggleIdColumn(true)
            ->prepareData();
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
            ->prepareData();
        $this->assertFalse($result['settings']['showDeleteButton']);

        $result = $list
            ->toggleDeleteButtonColumn(true)
            ->prepareData();
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
            ->prepareData();
        $this->assertFalse($result['settings']['showStatusButton']);

        $result = $list
            ->toggleStatusButtonColumn(true)
            ->prepareData();
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
            ->prepareData();
        $this->assertFalse($result['settings']['showEditButton']);

        $result = $list
            ->toggleEditButtonColumn(true)
            ->prepareData();
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
            ->prepareData();

        $this->assertEquals(2, count($result['meta']['columns']));
        $this->assertArrayHasKey('email', $result['meta']['columns']);
        $this->assertArrayHasKey('name', $result['meta']['columns']);
        $this->assertEquals('E-mail', $result['meta']['columns']['email']['title']);
        $this->assertEquals('Name', $result['meta']['columns']['name']['title']);
        $this->assertTrue($result['meta']['columns']['name'] instanceof StringField);
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
            ->prepareData();

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
            ->prepareData();

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
            ->prepareData();

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
            ->prepareData();

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
            ->prepareData();

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
                    'name' => 'NewName'
                ],
            ])
            ->prepareData();

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
                    'type' => CmsCommon::COLUMN_TYPE_TEXT
                ],
            ])
            ->prepareData();

        $this->assertTrue($result['meta']['columns']['email'] instanceof StringField);
        $this->assertTrue($result['meta']['columns']['name'] instanceof TextField);
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
