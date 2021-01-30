import {
  Entity, PrimaryGeneratedColumn, Column, BaseEntity
} from "typeorm";

@Entity("Users")
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    email: string;

    @Column("text")
    password: string;
}
