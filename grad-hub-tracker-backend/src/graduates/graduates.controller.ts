import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  UploadedFiles,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GraduatesService } from './graduates.service';
import { CreateGraduateDto } from './dto/create-graduate.dto';
import { UpdateGraduateDto } from './dto/update-graduate.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { Graduate } from './graduate.entity';

const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
const photosDir = join(uploadDir, 'photos');

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

@UseGuards(AuthGuard('jwt'))
@Controller('graduates')
export class GraduatesController {
  constructor(private service: GraduatesService) {}

  @Get()
  list(@Query('page') page?: string, @Query('q') q?: string) {
    return this.service.findAll({ page: page ? Number(page) : 1, q });
  }

  @Get('stats')
  stats() {
    return this.service.getStats();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateGraduateDto, @Query('actor') actor?: string) {
    return this.service.create(dto, actor);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGraduateDto,
    @Query('actor') actor?: string,
  ) {
    return this.service.update(id, dto, actor);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('actor') actor?: string) {
    return this.service.remove(id, actor);
  }

  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          ensureDir(photosDir);
          cb(null, photosDir);
        },
        filename: (req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          const id = randomUUID();
          cb(null, `${id}${ext}`);
        },
      }),
      limits: { fileSize: 3 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const ok = ['.jpg', '.jpeg', '.png'].includes(
          extname(file.originalname).toLowerCase(),
        );
        if (!ok) {
          return cb(new Error('허용되지 않은 파일 형식'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('actor') actor?: string,
  ) {
    if (!file) throw new BadRequestException('파일이 필요합니다');
    const url = `/uploads/photos/${file.filename}`;
    return this.service.setPhoto(id, url, actor);
  }

  @Delete(':id/photo')
  async deletePhoto(@Param('id') id: string, @Query('actor') actor?: string) {
    const g = await this.service.findOne(id);
    if (g.photoUrl) {
      const path = join(
        process.cwd(),
        g.photoUrl.replace('/uploads', uploadDir),
      );
      try {
        unlinkSync(path);
      } catch {
        // ignore
      }
    }
    return this.service.clearPhoto(id, actor);
  }

  @Post('photos/bulk')
  @UseInterceptors(
    FilesInterceptor('files', 100, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          ensureDir(photosDir);
          cb(null, photosDir);
        },
        filename: (req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          const id = randomUUID();
          cb(null, `${id}${ext}`);
        },
      }),
      limits: { fileSize: 3 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const ok = ['.jpg', '.jpeg', '.png'].includes(
          extname(file.originalname).toLowerCase(),
        );
        if (!ok) {
          return cb(new Error('허용되지 않은 파일 형식'), false);
        }
        cb(null, true);
      },
    }),
  )
  async bulkPhotos(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('match') match?: 'phone' | 'email' | 'name_birthDate',
    @Query('actor') actor?: string,
    @Query('overwrite') overwrite?: string,
  ) {
    const allowOverwrite = overwrite !== '0';
    const results: {
      filename: string;
      matchedId?: string;
      ok: boolean;
      reason?: string;
    }[] = [];

    const stripExt = (n: string) => n.replace(/\.[^/.]+$/, '');
    const digits = (s: string) => (s || '').replace(/\D+/g, '');
    const norm = (s: string) => (s || '').trim().toLowerCase();
    const parseNameBirth = (
      base: string,
    ): { name: string; birth: string } | null => {
      const b = base.trim();
      const m1 = b.match(/^(.*?)[-_](\d{4}-\d{2}-\d{2})$/);
      if (m1) return { name: m1[1].trim(), birth: m1[2] };
      const m2 = b.match(/^(.*?)[-_](\d{8})$/);
      if (m2) {
        const y = m2[2].slice(0, 4);
        const mo = m2[2].slice(4, 6);
        const d = m2[2].slice(6, 8);
        return { name: m2[1].trim(), birth: `${y}-${mo}-${d}` };
      }
      return null;
    };

    for (const f of files || []) {
      const base = stripExt(f.originalname);
      try {
        let gId: string | undefined;
        if (match === 'phone') {
          const ph = digits(base);
          const g: Graduate | null = await this.service.findByPhoneDigits(ph);
          if (g) gId = g.id;
        } else if (match === 'email') {
          const g: Graduate | null = await this.service.findByEmail(norm(base));
          if (g) gId = g.id;
        } else if (match === 'name_birthDate') {
          const parsed = parseNameBirth(base);
          if (!parsed) throw new Error('이름+생년월일 형식이 아닙니다');
          const g: Graduate | null = await this.service.findByNameBirthDate(
            parsed.name,
            parsed.birth,
          );
          if (g) gId = g.id;
        } else {
          throw new Error(
            'match 파라미터가 필요합니다 (phone|email|name_birthDate)',
          );
        }

        if (!gId) {
          results.push({
            filename: f.originalname,
            ok: false,
            reason: '대상을 찾을 수 없음',
          });
          continue;
        }
        if (!allowOverwrite) {
          const curr = await this.service.findOne(gId);
          if (curr.photoUrl) {
            results.push({
              filename: f.originalname,
              ok: false,
              matchedId: gId,
              reason: '기존 사진 존재',
            });
            continue;
          }
        }

        const url = `/uploads/photos/${f.filename}`;
        await this.service.setPhoto(gId, url, actor);
        results.push({ filename: f.originalname, ok: true, matchedId: gId });
      } catch (e) {
        results.push({
          filename: f.originalname,
          ok: false,
          reason: (e as Error)?.message || '오류',
        });
      }
    }

    return { ok: true, count: results.length, results };
  }
}
