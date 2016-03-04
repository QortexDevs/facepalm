<?php
//namespace Facepalm\Tests;
//
//use Facepalm\Cms\CmsCommon;
//use Facepalm\Cms\Components\CmsList;
//use Facepalm\Cms\Fields\Types\StringField;
//use Facepalm\Cms\Fields\Types\TextField;
//use Facepalm\Tools\Tree;
//use App\Models\User;
//use Illuminate\Foundation\Testing\DatabaseTransactions;
//use Illuminate\Support\Str;
//
//class CmsListTest extends TestCase
//{
//    use DatabaseTransactions;
//
//    /**
//     */
//    public function testCmsListRequireModelDefinition()
//    {
//        $this->setExpectedException('Exception', 'No model defined');
//        (new CmsList())->build();
//    }
//
//    /**
//     *
//     */
//    public function testSetModel()
//    {
//        $result = (new CmsList())
//            ->setMainModel('User')
//            ->build();
//        $this->assertTrue(is_array($result));
//        $this->assertArrayHasKey('meta', $result);
//        $this->assertEquals('User', $result['meta']['model']);
//    }
//
//    /**
//     *
//     */
//    public function testSetModelLowercase()
//    {
//        $result = (new CmsList())
//            ->setMainModel('user')
//            ->build();
//        $this->assertTrue(is_array($result));
//        $this->assertArrayHasKey('meta', $result);
//        $this->assertEquals('User', $result['meta']['model']);
//    }
//
//    /**
//     *
//     */
//    public function testSetUnknownModel()
//    {
//        $this->setExpectedException('Exception', 'Cannot find class');
//        (new CmsList())
//            ->setMainModel('user2')
//            ->build();
//    }
//
//    /**
//     *
//     */
//    public function testResultHasAllKeys()
//    {
//        $this->createDummyUsersData();
//        $result = (new CmsList())
//            ->setMainModel('User')
//            ->build();
//        $this->assertTrue(is_array($result));
//        $this->assertArrayHasKey('settings', $result);
//        $this->assertArrayHasKey('tree', $result);
//        $this->assertTrue($result['tree'] instanceof Tree);
//        $this->assertGreaterThan(0, count($result['tree']->getAllElements()));
//    }
//
//    /**
//     *
//     */
//    public function testToggleId()
//    {
//        $list = (new CmsList())
//            ->setMainModel('User');
//
//        $result = $list
//            ->toggleIdColumn(false)
//            ->build();
//        $this->assertFalse($result['settings']['showIdColumn']);
//
//        $result = $list
//            ->toggleIdColumn(true)
//            ->build();
//        $this->assertTrue($result['settings']['showIdColumn']);
//    }
//
//    /**
//     *
//     */
//    public function testToggleDeleteButtonColumn()
//    {
//        $list = (new CmsList())
//            ->setMainModel('User');
//
//        $result = $list
//            ->toggleDeleteButtonColumn(false)
//            ->build();
//        $this->assertFalse($result['settings']['showDeleteButton']);
//
//        $result = $list
//            ->toggleDeleteButtonColumn(true)
//            ->build();
//        $this->assertTrue($result['settings']['showDeleteButton']);
//    }
//
//    /**
//     *
//     */
//    public function testToggleStatusButtonColumn()
//    {
//        $list = (new CmsList())
//            ->setMainModel('User');
//
//        $result = $list
//            ->toggleStatusButtonColumn(false)
//            ->build();
//        $this->assertFalse($result['settings']['showStatusButton']);
//
//        $result = $list
//            ->toggleStatusButtonColumn(true)
//            ->build();
//        $this->assertTrue($result['settings']['showStatusButton']);
//    }
//
//
//    /**
//     *
//     */
//    public function testToggleEditButtonColumn()
//    {
//        $list = (new CmsList())
//            ->setMainModel('User');
//
//        $result = $list
//            ->toggleEditButtonColumn(false)
//            ->build();
//        $this->assertFalse($result['settings']['showEditButton']);
//
//        $result = $list
//            ->toggleEditButtonColumn(true)
//            ->build();
//        $this->assertTrue($result['settings']['showEditButton']);
//    }
//
//    /**
//     * @throws \Exception
//     */
//    public function testSetColumns()
//    {
//        $this->createDummyUsersData();
//        $result = (new CmsList())
//            ->setMainModel('User')
//            ->setColumns([
//                'email' => [
//                    'title' => 'E-mail'
//                ],
//                'name' => [
//                    'title' => 'Name'
//                ],
//            ])
//            ->build();
//
//        $this->assertEquals(2, count($result['meta']['columns']));
//        $this->assertArrayHasKey('email', $result['meta']['columns']);
//        $this->assertArrayHasKey('name', $result['meta']['columns']);
//        $this->assertEquals('E-mail', $result['meta']['columns']['email']['title']);
//        $this->assertEquals('Name', $result['meta']['columns']['name']['title']);
//        $this->assertTrue($result['meta']['columns']['name'] instanceof StringField);
//        $this->assertArrayHasKey('id', $result['tree']->getAllElements()[0]);
//        $this->assertArrayHasKey('email', $result['tree']->getAllElements()[0]);
//        $this->assertArrayHasKey('name', $result['tree']->getAllElements()[0]);
//    }
//
//    /**
//     * @throws \Exception
//     */
//    public function testSetColumnsTitles()
//    {
//        $this->createDummyUsersData();
//        $result = (new CmsList())
//            ->setMainModel('User')
//            ->setColumns([
//                'email' => [
//                ],
//                'name' => [
//                    'title' => 'Name'
//                ],
//            ], [
//                'email' => 'E-mail',
//                'name' => 'WrongName'
//            ])
//            ->build();
//
//        $this->assertEquals('E-mail', $result['meta']['columns']['email']['title']);
//        $this->assertEquals('Name', $result['meta']['columns']['name']['title']);
//    }
//
//    /**
//     * @throws \Exception
//     */
//    public function testSetColumnsTitlesArray()
//    {
//        $this->createDummyUsersData();
//        $result = (new CmsList())
//            ->setMainModel('User')
//            ->setColumns([
//                'email' => [
//                ],
//                'name' => [
//                ],
//            ], [
//                'E-mail',
//                'Name'
//            ])
//            ->build();
//
//        $this->assertEquals('E-mail', $result['meta']['columns']['email']['title']);
//        $this->assertEquals('Name', $result['meta']['columns']['name']['title']);
//    }
//
//    /**
//     * @throws \Exception
//     */
//    public function testSetColumnsAndTitlesAsArray()
//    {
//        $this->createDummyUsersData();
//        $result = (new CmsList())
//            ->setMainModel('User')
//            ->setColumns([
//                'email',
//                'name'
//            ], [
//                'E-mail',
//                'Name'
//            ])
//            ->build();
//
//        $this->assertEquals('E-mail', $result['meta']['columns']['email']['title']);
//        $this->assertEquals('Name', $result['meta']['columns']['name']['title']);
//    }
//
//    /**
//     * @throws \Exception
//     */
//    public function testSetColumnsAsArrayWithoutTitles()
//    {
//        $this->createDummyUsersData();
//        $result = (new CmsList())
//            ->setMainModel('User')
//            ->setColumns([
//                'email',
//                'name'
//            ])
//            ->build();
//
//        $this->assertEquals(2, count($result['meta']['columns']));
//        $this->assertArrayHasKey('email', $result['meta']['columns']);
//        $this->assertArrayHasKey('name', $result['meta']['columns']);
//        $this->assertArrayHasKey('email', $result['tree']->getAllElements()[0]);
//        $this->assertArrayHasKey('name', $result['tree']->getAllElements()[0]);
//    }
//
//    /**
//     * @throws \Exception
//     */
//    public function testSetColumnAsString()
//    {
//        $this->createDummyUsersData();
//        $result = (new CmsList())
//            ->setMainModel('User')
//            ->setColumns([
//                'email'
//            ])
//            ->build();
//
//        $this->assertEquals(1, count($result['meta']['columns']));
//        $this->assertArrayHasKey('email', $result['meta']['columns']);
//        $this->assertArrayHasKey('email', $result['tree']->getAllElements()[0]);
//    }
//
//    /**
//     * @throws \Exception
//     */
//    public function testSetColumnOverrideName()
//    {
//        $this->createDummyUsersData();
//        $result = (new CmsList())
//            ->setMainModel('User')
//            ->setColumns([
//                'email' => [
//                ],
//                'oldName' => [
//                    'name' => 'name'
//                ],
//            ])
//            ->build();
//
//        $this->assertArrayNotHasKey('oldName', $result['meta']['columns']);
//        $this->assertArrayHasKey('name', $result['meta']['columns']);
//        $this->assertArrayHasKey('name', $result['tree']->getAllElements()[0]);
//    }
//
//    /**
//     * @throws \Exception
//     */
//    public function testSetColumnType()
//    {
//        $this->createDummyUsersData();
//        $result = (new CmsList())
//            ->setMainModel('User')
//            ->setColumns([
//                'email' => [
//                ],
//                'name' => [
//                    'type' => CmsCommon::COLUMN_TYPE_TEXT
//                ],
//            ])
//            ->build();
//
//        $this->assertTrue($result['meta']['columns']['email'] instanceof StringField);
//        $this->assertTrue($result['meta']['columns']['name'] instanceof TextField);
//    }
//
//
//    /**
//     *
//     */
//    private function createDummyUsersData()
//    {
//        $user = new User();
//        $user->email = 'test' . Str::quickRandom() . '@test.test';
//        $user->save();
//
//    }
//}
