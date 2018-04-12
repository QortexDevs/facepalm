<?php
//namespace Tests;
//
//use Facepalm\Cms\CmsCommon;
//use Facepalm\Cms\Components\CmsForm;
//use Facepalm\Cms\Components\CmsList;
//use Facepalm\Cms\Fields\Types\StringField;
//use Facepalm\Cms\Fields\Types\TextField;
//use App\Models\User;
//use Illuminate\Foundation\Testing\DatabaseTransactions;
//use Illuminate\Support\Str;
//
//class CmsFormTest extends TestCase
//{
//    use DatabaseTransactions;
//
//    /**
//     */
//    public function testCmsFormRequireModelDefinition()
//    {
//        $this->setExpectedException('Exception', 'No model defined');
//        (new CmsForm())->build();
//    }
//
//    /**
//     *
//     */
//    public function testSetModel()
//    {
//        $result = (new CmsForm())
//            ->setMainModel('User')
//            ->build();
//        $this->assertTrue(is_array($result));
//        $this->assertArrayHasKey('fields', $result);
//        $this->assertArrayHasKey('object', $result);
//        $this->assertEquals(null, $result['object']);
//    }
//
//
//    /**
//     *
//     */
//    public function testSetModelAndFields()
//    {
//        $result = (new CmsForm())
//            ->setMainModel('User')
//            ->setFields([
//                'email' => [
//                    'title' => 'E-mail'
//                ],
//                'name' => [
//                    'title' => 'Name'
//                ],
//            ])
//            ->build();
//
//        $this->assertEquals(2, count($result['fields']));
//        $this->assertTrue($result['fields']['email'] instanceof StringField);
////        $this->assertEquals(
////            1,
////            preg_match('/create\[User\]\[%CREATE_.{6}%\]/', $result['fields']['email']['parameters']['fieldNameBase'])
////        );
////        $this->assertEquals(
////            1,
////            preg_match('/upload\[User\]\[%CREATE_.{6}%\]/', $result['fields']['email']['parameters']['uploadName'])
////        );
//    }
//
//    /**
//     *
//     */
//    public function testSetModelAndObjectAndFields()
//    {
//        $user = new User();
//        $user->id = 22;
//        $user->email = 'test@rest';
//        $result = (new CmsForm())
//            ->setMainModel('User')
//            ->setEditedObject($user)
//            ->setFields([
//                'email' => [
//                    'title' => 'E-mail'
//                ],
//                'name' => [
//                    'title' => 'Name'
//                ],
//            ])
//            ->build();
//
//        $this->assertTrue($result['object'] instanceof User);
//        $this->assertEquals('test@rest', $result['object']->email);
////        $this->assertEquals('save[User][22]', $result['fields']['email']['parameters']['fieldNameBase']);
////        $this->assertEquals('upload[User][22]', $result['fields']['email']['parameters']['uploadName']);
//    }
//
//    /**
//     *
//     */
//    public function testSetModelAndObjectByIdAndFields()
//    {
//        $user = new User();
//        $user->email = 'test' . Str::quickRandom() . '@test.test';
//        $user->save();
//
//        $result = (new CmsForm())
//            ->setMainModel('User')
//            ->setEditedObject($user->id)
//            ->setFields([
//                'email' => [
//                    'title' => 'E-mail'
//                ],
//                'name' => [
//                    'title' => 'Name'
//                ],
//            ])
//            ->build();
//
//        $this->assertTrue($result['object'] instanceof User);
//        $this->assertEquals($user->email, $result['object']->email);
////        $this->assertEquals('save[User][' . $user->id . ']', $result['fields']['email']['parameters']['fieldNameBase']);
////        $this->assertEquals('upload[User][' . $user->id . ']', $result['fields']['email']['parameters']['uploadName']);
//    }
//
//    /**
//     *
//     */
//    public function testSetModelAndObjectByUnknownId()
//    {
//        $id = 5564934;
//        $this->setExpectedException('Exception', 'Object with id:' . $id . ' not found');
//        $result = (new CmsForm())
//            ->setMainModel('User')
//            ->setEditedObject($id)
//            ->build();
//
//    }
//
//
//}
