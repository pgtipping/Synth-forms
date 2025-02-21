"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authOptions = exports.runtime = exports.dynamic = void 0;
const credentials_1 = __importDefault(require("next-auth/providers/credentials"));
const auth_utils_1 = require("./auth-utils");
const prisma_1 = require("./prisma");
// Mark this file as server-only
exports.dynamic = 'force-dynamic';
exports.runtime = 'nodejs';
exports.authOptions = {
    providers: [
        (0, credentials_1.default)({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            authorize(credentials) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        if (!(credentials === null || credentials === void 0 ? void 0 : credentials.email) || !(credentials === null || credentials === void 0 ? void 0 : credentials.password)) {
                            return null;
                        }
                        const user = yield prisma_1.prisma.user.findUnique({
                            where: {
                                email: credentials.email
                            },
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                role: true
                            }
                        });
                        if (!user) {
                            return null;
                        }
                        // For demo purposes, we'll use a hardcoded password
                        // TODO: Implement proper password storage mechanism
                        const DEMO_PASSWORD_HASH = process.env.DEMO_PASSWORD_HASH || "$2b$10$demopasswordhash";
                        const isPasswordValid = yield (0, auth_utils_1.verifyPassword)(credentials.password, DEMO_PASSWORD_HASH);
                        if (!isPasswordValid) {
                            return null;
                        }
                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                        };
                    }
                    catch (error) {
                        console.error('Auth error:', error);
                        return null;
                    }
                });
            }
        })
    ],
    session: {
        strategy: 'jwt'
    },
    pages: {
        signIn: '/login'
    },
    secret: process.env.NEXTAUTH_SECRET,
};
