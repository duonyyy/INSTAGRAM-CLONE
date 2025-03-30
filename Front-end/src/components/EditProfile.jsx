import React, { useRef, useState } from 'react' // Import React và các hook: useRef để tham chiếu DOM, useState để quản lý state
import { useDispatch, useSelector } from 'react-redux' // Hook từ Redux: useDispatch để gửi action, useSelector để lấy state
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'; // Component UI hiển thị ảnh đại diện
import { Button } from './ui/button'; // Nút bấm
import { Textarea } from './ui/textarea'; // Ô nhập văn bản lớn
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select'; // Dropdown để chọn giới tính
import axios from 'axios'; // Thư viện gửi HTTP request
import { Loader2 } from 'lucide-react'; // Icon loading từ Lucide
import { useNavigate } from 'react-router-dom'; // Hook để điều hướng giữa các trang
import { toast } from 'sonner'; // Thư viện hiển thị thông báo
import { setAuthUser } from '@/redux/authSlice'; // Action Redux để cập nhật thông tin người dùng

const EditProfile = () => {
    const imageRef = useRef(); // Tạo ref để tham chiếu đến input file ẩn (dùng để chọn ảnh)
    const { user } = useSelector(store => store.auth); // Lấy thông tin user từ Redux store
    const [loading, setLoading] = useState(false); // State để kiểm soát trạng thái loading khi gửi request
    const [input, setInput] = useState({ // State chứa dữ liệu form, khởi tạo từ thông tin user hiện tại
        profilePhoto: user?.profilePicture, // Ảnh đại diện
        bio: user?.bio, // Tiểu sử
        gender: user?.gender // Giới tính
    });
    const navigate = useNavigate(); // Hook để điều hướng sau khi cập nhật thành công
    const dispatch = useDispatch(); // Hook để gửi action Redux

    // Xử lý khi người dùng chọn file ảnh mới
    const fileChangeHandler = (e) => {
        const file = e.target.files?.[0]; // Lấy file đầu tiên từ input
        if (file) setInput({ ...input, profilePhoto: file }); // Cập nhật state với file mới
    }

    // Xử lý khi người dùng thay đổi lựa chọn giới tính từ dropdown
    const selectChangeHandler = (value) => {
        setInput({ ...input, gender: value }); // Cập nhật state với giá trị giới tính mới
    }

    // Hàm gửi dữ liệu chỉnh sửa lên server
    const editProfileHandler = async () => {
        console.log(input); // Log để debug dữ liệu input
        const formData = new FormData(); // Tạo FormData để gửi dữ liệu dạng multipart (hỗ trợ file)
        formData.append("bio", input.bio); // Thêm bio vào FormData
        formData.append("gender", input.gender); // Thêm gender vào FormData
        if(input.profilePhoto){ // Nếu có ảnh mới thì thêm vào FormData
            formData.append("profilePhoto", input.profilePhoto);
        }
        try {
            setLoading(true); // Bật trạng thái loading
            const res = await axios.post('http://localhost:8080/api/v1/user/profile/edit', formData, { // Gửi request POST
                headers: {
                    'Content-Type': 'multipart/form-data' // Định dạng dữ liệu gửi đi
                },
                withCredentials: true // Gửi cookie để xác thực
            });
            if(res.data.success){ // Nếu request thành công
                const updatedUserData = { // Tạo object user mới với thông tin đã cập nhật
                    ...user,
                    bio: res.data.user?.bio,
                    profilePicture: res.data.user?.profilePicture,
                    gender: res.data.user.gender
                };
                dispatch(setAuthUser(updatedUserData)); // Cập nhật Redux store với thông tin mới
                navigate(`/profile/${user?._id}`); // Điều hướng về trang profile
                toast.success(res.data.message); // Hiển thị thông báo thành công
            }
        } catch (error) { // Xử lý lỗi nếu request thất bại
            console.log(error); // Log lỗi để debug
            toast.error(error.response.data.message); // Hiển thị thông báo lỗi
        } finally {
            setLoading(false); // Tắt trạng thái loading dù thành công hay thất bại
        }
    }

    // JSX: Giao diện của component
    return (
        <div className='flex max-w-2xl mx-auto pl-10'> {/* Container chính, căn giữa với chiều rộng tối đa */}
            <section className='flex flex-col gap-6 w-full my-8'> {/* Section chứa form */}
                <h1 className='font-bold text-xl'>Edit Profile</h1> {/* Tiêu đề */}
                <div className='flex items-center justify-between bg-gray-100 rounded-xl p-4'> {/* Khu vực ảnh đại diện */}
                    <div className='flex items-center gap-3'> {/* Hiển thị ảnh và thông tin */}
                        <Avatar> {/* Component ảnh đại diện */}
                            <AvatarImage src={user?.profilePicture} alt="post_image" /> {/* Ảnh hiện tại */}
                            <AvatarFallback>CN</AvatarFallback> {/* Hiển thị chữ cái nếu không có ảnh */}
                        </Avatar>
                        <div>
                            <h1 className='font-bold text-sm'>{user?.username}</h1> {/* Tên người dùng */}
                            <span className='text-gray-600'>{user?.bio || 'Bio here...'}</span> {/* Bio hiện tại */}
                        </div>
                    </div>
                    <input ref={imageRef} onChange={fileChangeHandler} type='file' className='hidden' /> {/* Input file ẩn */}
                    <Button onClick={() => imageRef?.current.click()} className='bg-[#0095F6] h-8 hover:bg-[#318bc7]'>
                        Change photo {/* Nút kích hoạt input file */}
                    </Button>
                </div>
                <div> {/* Khu vực chỉnh sửa bio */}
                    <h1 className='font-bold text-xl mb-2'>Bio</h1>
                    <Textarea 
                        value={input.bio} // Giá trị bio từ state
                        onChange={(e) => setInput({ ...input, bio: e.target.value })} // Cập nhật state khi nhập
                        name='bio' 
                        className="focus-visible:ring-transparent" // Loại bỏ viền focus mặc định
                    />
                </div>
                <div> {/* Khu vực chọn giới tính */}
                    <h1 className='font-bold mb-2'>Gender</h1>
                    <Select defaultValue={input.gender} onValueChange={selectChangeHandler}> {/* Dropdown */}
                        <SelectTrigger className="w-full"> {/* Nút hiển thị giá trị đã chọn */}
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent> {/* Nội dung dropdown */}
                            <SelectGroup>
                                <SelectItem value="male">Male</SelectItem> {/* Lựa chọn Nam */}
                                <SelectItem value="female">Female</SelectItem> {/* Lựa chọn Nữ */}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <div className='flex justify-end'> {/* Nút submit */}
                    {
                        loading ? ( // Nếu đang loading thì hiển thị nút với spinner
                            <Button className='w-fit bg-[#0095F6] hover:bg-[#2a8ccd]'>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                Please wait
                            </Button>
                        ) : ( // Nếu không loading thì hiển thị nút bình thường
                            <Button onClick={editProfileHandler} className='w-fit bg-[#0095F6] hover:bg-[#2a8ccd]'>
                                Submit
                            </Button>
                        )
                    }
                </div>
            </section>
        </div>
    )
}

export default EditProfile // Xuất component để sử dụng ở nơi khác