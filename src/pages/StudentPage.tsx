import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, UserRound, BookOpen, MapPin, Phone, Mail } from 'lucide-react';
import Navbar from '@/components/Nabvar';
import { StudentResponse } from '@/types';
import { fetchStudentData } from '@/api';
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { setProgress } from '@/store/progressSlice';

function StudentPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [studentData, setStudentData] = useState<StudentResponse>({
        success: true,
        count: 0,
        pageNO: 1,
        pages: 1,
        data: [],
    });
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            const getData = async () => {
                try {
                    dispatch(setProgress(30));
                    const data = await fetchStudentData(currentPage, searchQuery);
                    dispatch(setProgress(70));
                    setStudentData(data);
                    dispatch(setProgress(100));
                } catch (error) {
                    dispatch(setProgress(100));
                    console.error(error);
                }
            };

            getData();
        }, 800); 

        return () => clearTimeout(delayDebounce); 
    }, [currentPage, searchQuery, dispatch]);



    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const renderPaginationItems = () => {
        const items = [];
        const totalPages = studentData.pages;
        const maxVisiblePages = 10;

        let startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
        let endPage = startPage + maxVisiblePages - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(endPage - maxVisiblePages + 1, 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink
                        onClick={() => handlePageChange(i)}
                        isActive={currentPage === i}
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        return items;
    };

    return (
        <>
            <Navbar />
            <div className=" bg-background px-6 space-y-8">
                <div className="container mx-auto space-y-6">
                    <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center">
                        <h1 className="text-3xl font-bold tracking-tight">Students</h1>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search by name, roll number, or email..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Table Container with horizontal scrolling on small screens */}
                    <div className="rounded-lg border bg-card overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Roll No.</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Stream</TableHead>
                                    <TableHead className="hidden md:table-cell">Address</TableHead>
                                    <TableHead className="hidden sm:table-cell">Contact</TableHead>
                                    <TableHead className="hidden lg:table-cell">Email</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentData.data.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.rollnumber}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <UserRound className="h-4 w-4 text-muted-foreground" />
                                                <span>{student.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                <span>{student.stream}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="truncate max-w-[200px]" title={student.address}>
                                                    {student.address}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <div className="flex items-center space-x-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span>{student.mobileNo}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="flex items-center space-x-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="truncate max-w-[200px]" title={student.email}>
                                                    {student.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-col items-center space-y-4 absolute bottom-2 w-[85%]">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={(e) => {
                                            if (currentPage === 1) {
                                                e.preventDefault();
                                                return;
                                            }
                                            handlePageChange(currentPage - 1);
                                        }}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                                {renderPaginationItems()}
                                {studentData.pages > 5 && <PaginationEllipsis />}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={(e) => {
                                            if (currentPage === studentData.pages) {
                                                e.preventDefault();
                                                return;
                                            }
                                            handlePageChange(currentPage + 1);
                                        }}
                                        className={currentPage === studentData.pages ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>

                        <div className="text-sm text-muted-foreground">
                            Page {currentPage} of {studentData.pages} • Total Students: {studentData.count}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default StudentPage;
